import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

function parseCsvLine(line: string): string[] {
  return line.split(',').map((s) => s.trim());
}

function splitCities(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data', 'zip_code_database.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');

  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    console.log('CSV looks empty');
    return;
  }

  const header = parseCsvLine(lines[0]);
  const colIndex = (name: string) => {
    const idx = header.indexOf(name);
    if (idx === -1)
      throw new Error(
        `Missing column "${name}" in CSV header: ${header.join(', ')}`,
      );
    return idx;
  };

  const iZip = colIndex('zip');
  const iState = colIndex('state');
  const iCounty = colIndex('county');
  const iPrimaryCity = colIndex('primary_city');
  const iAcceptable = colIndex('acceptable_cities');

  let processed = 0;

  for (let k = 1; k < lines.length; k++) {
    const row = parseCsvLine(lines[k]);
    if (row.length !== header.length) continue;

    const zip = row[iZip];
    const state = row[iState];
    const county = row[iCounty];
    const primaryCity = row[iPrimaryCity];
    const acceptableRaw = row[iAcceptable];

    if (!zip || !state || !county || !primaryCity) continue;

    // 1) upsert zip row
    await prisma.zip_codes.upsert({
      where: { zip },
      create: {
        zip,
        state_code: state,
        county_name: county,
        primary_city_name: primaryCity,
      },
      update: {
        state_code: state,
        county_name: county,
        primary_city_name: primaryCity,
      },
    });

    // 2) build unique city list for this ZIP
    const acceptableCities = splitCities(acceptableRaw);
    const allCities = Array.from(new Set([primaryCity, ...acceptableCities]));

    // 3) upsert cities and collect ids
    const cityIds: { id: bigint; name: string }[] = [];
    for (const cityName of allCities) {
      const city = await prisma.cities.upsert({
        where: {
          state_code_city_name: { state_code: state, city_name: cityName },
        },
        create: { state_code: state, city_name: cityName },
        update: {},
      });
      cityIds.push({ id: city.id, name: cityName });
    }

    // 4) create zip->cities rows (skip duplicates)
    await prisma.zip_cities.createMany({
      data: cityIds.map((c) => ({
        zip,
        city_id: c.id,
        is_primary: c.name === primaryCity,
      })),
      skipDuplicates: true,
    });

    processed++;
    if (processed % 500 === 0) {
      console.log(`Processed ${processed} ZIP rows...`);
    }
  }

  console.log(`Done. Processed ${processed} ZIP rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
