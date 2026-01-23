import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'csv-parse';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';

const ZIP_CHUNK_SIZE = 2000;
const CITY_CHUNK_SIZE = 2000;
const JOIN_CHUNK_SIZE = 5000;
const LOG_EVERY = 1000;
const UPDATE_EXISTING_ZIPS = true;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type ZipCodeRow = {
  zip: string;
  state_code: string;
  county_name: string;
  primary_city_name: string;
};

type ParsedZipRow = ZipCodeRow & {
  city_names: string[];
};

function cleanValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/""/g, '"').trim();
  return cleaned;
}

function splitCities(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => cleanValue(s))
    .filter(Boolean);
}

function cityKey(stateCode: string, cityName: string): string {
  return `${stateCode}::${cityName}`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function readCsv(csvPath: string): Promise<{
  rows: ParsedZipRow[];
  uniqueCities: { state_code: string; city_name: string }[];
}> {
  const rows: ParsedZipRow[] = [];
  const uniqueCities: { state_code: string; city_name: string }[] = [];
  const cityKeySet = new Set<string>();

  const parser = parse({
    columns: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });
  const pipelinePromise = pipeline(fs.createReadStream(csvPath), parser);

  let parsed = 0;
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    const zip = cleanValue(record.zip);
    const state = cleanValue(record.state);
    const county = cleanValue(record.county);
    const primaryCity = cleanValue(record.primary_city);
    const acceptableRaw = cleanValue(record.acceptable_cities);

    if (!zip || !state || !county || !primaryCity) {
      continue;
    }

    const acceptableCities = splitCities(acceptableRaw);
    const cityNameSet = new Set<string>([primaryCity, ...acceptableCities]);
    const cityNames = Array.from(cityNameSet);

    rows.push({
      zip,
      state_code: state,
      county_name: county,
      primary_city_name: primaryCity,
      city_names: cityNames,
    });

    for (const cityName of cityNames) {
      const key = cityKey(state, cityName);
      if (!cityKeySet.has(key)) {
        cityKeySet.add(key);
        uniqueCities.push({ state_code: state, city_name: cityName });
      }
    }

    parsed++;
    if (parsed % LOG_EVERY === 0) {
      console.log(`Parsed ${parsed} rows...`);
    }
  }

  await pipelinePromise;

  return { rows, uniqueCities };
}

async function upsertZipCodes(rows: ZipCodeRow[]): Promise<void> {
  if (!rows.length) return;
  const values = rows.map(
    (row) =>
      Prisma.sql`(${row.zip}, ${row.state_code}, ${row.county_name}, ${row.primary_city_name})`,
  );

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "zip_codes" ("zip", "state_code", "county_name", "primary_city_name")
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("zip") DO UPDATE SET
        "state_code" = EXCLUDED."state_code",
        "county_name" = EXCLUDED."county_name",
        "primary_city_name" = EXCLUDED."primary_city_name"
    `,
  );
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data', 'zip_code_database.csv');
  console.log(`Reading CSV from ${csvPath}`);

  const { rows, uniqueCities } = await readCsv(csvPath);
  if (!rows.length) {
    console.log('CSV looks empty.');
    return;
  }

  console.log(
    `Loaded ${rows.length} ZIP rows and ${uniqueCities.length} unique cities.`,
  );

  console.log('Phase A: inserting/upserting ZIP codes...');
  const zipRows = rows.map(
    ({ zip, state_code, county_name, primary_city_name }) => ({
      zip,
      state_code,
      county_name,
      primary_city_name,
    }),
  );

  let zipProcessed = 0;
  for (const chunk of chunkArray(zipRows, ZIP_CHUNK_SIZE)) {
    if (UPDATE_EXISTING_ZIPS) {
      await upsertZipCodes(chunk);
    } else {
      await prisma.zip_codes.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
    zipProcessed += chunk.length;
    console.log(`ZIPs processed: ${zipProcessed}/${zipRows.length}`);
  }

  console.log('Phase B: inserting cities...');
  let citiesProcessed = 0;
  for (const chunk of chunkArray(uniqueCities, CITY_CHUNK_SIZE)) {
    await prisma.cities.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    citiesProcessed += chunk.length;
    console.log(`Cities processed: ${citiesProcessed}/${uniqueCities.length}`);
  }

  console.log('Phase C: fetching city ids...');
  const cities = await prisma.cities.findMany({
    select: { id: true, state_code: true, city_name: true },
  });
  const cityIdByKey = new Map<string, bigint>();
  for (const city of cities) {
    cityIdByKey.set(cityKey(city.state_code, city.city_name), city.id);
  }

  const missingCities = uniqueCities.filter(
    (city) => !cityIdByKey.has(cityKey(city.state_code, city.city_name)),
  );
  if (missingCities.length) {
    throw new Error(`Missing ${missingCities.length} cities after insert.`);
  }

  console.log('Phase D: inserting ZIP-to-city joins...');
  const joinRows: { zip: string; city_id: bigint; is_primary: boolean }[] = [];
  let joinPrepared = 0;

  for (const row of rows) {
    const seenCityIds = new Set<bigint>();
    for (const cityName of row.city_names) {
      const cityId = cityIdByKey.get(cityKey(row.state_code, cityName));
      if (!cityId) {
        throw new Error(`City id not found for ${row.state_code} ${cityName}`);
      }
      if (seenCityIds.has(cityId)) continue;
      seenCityIds.add(cityId);
      joinRows.push({
        zip: row.zip,
        city_id: cityId,
        is_primary: cityName === row.primary_city_name,
      });
    }

    joinPrepared++;
    if (joinPrepared % LOG_EVERY === 0) {
      console.log(`Prepared joins for ${joinPrepared}/${rows.length} rows`);
    }
  }

  let joinProcessed = 0;
  for (const chunk of chunkArray(joinRows, JOIN_CHUNK_SIZE)) {
    await prisma.zip_cities.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    joinProcessed += chunk.length;
    console.log(`Joins inserted: ${joinProcessed}/${joinRows.length}`);
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
