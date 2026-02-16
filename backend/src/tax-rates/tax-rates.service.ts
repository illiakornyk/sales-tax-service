import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeographyService } from '../geography/geography.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, tax_rates } from '../generated/prisma/client';
import { CreateTaxRateDto, JurisdictionType } from './dto/create-tax-rate.dto';
import { GetCurrentTaxRatesQueryDto } from './dto/get-current-tax-rates.dto';
import {
  CurrentTaxRateItem,
  CurrentTaxRateSectionPagination,
  CurrentTaxRatesResponse,
  EffectiveRates,
  NormalizedCreateDto,
  TaxRateResponse,
  ZipInfo,
  ZipRateResult,
} from './types/tax-rate.types';

type TaxRateWithCity = Prisma.tax_ratesGetPayload<{
  include: { cities: { select: { city_name: true } } };
}>;

type CurrentSectionPageResult = {
  items: CurrentTaxRateItem[];
  pagination: CurrentTaxRateSectionPagination;
};

@Injectable()
export class TaxRatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geographyService: GeographyService,
  ) {}

  async createTaxRateVersion(dto: CreateTaxRateDto): Promise<TaxRateResponse> {
    const normalized = this.normalizeCreateDto(dto);
    this.validateCreateDto(normalized, dto.jurisdictionType, dto.cityId);

    await this.assertStateExists(normalized.stateCode);
    if (
      dto.jurisdictionType === JurisdictionType.COUNTY &&
      normalized.countyName
    ) {
      await this.assertCountyExists(
        normalized.stateCode,
        normalized.countyName,
      );
    }

    const cityId = await this.resolveCityIdForCreate(
      dto.jurisdictionType,
      normalized,
      dto.cityId,
    );

    const created = await this.createTaxRateRow({
      jurisdiction_type: dto.jurisdictionType,
      state_code: normalized.stateCode,
      county_name: normalized.countyName,
      rate: normalized.rateDecimal,
      start_time: normalized.startTime,
      ...(cityId !== null ? { cities: { connect: { id: cityId } } } : {}),
    });
    return this.toTaxRateResponse(created);
  }

  async getRatesByZip(zip: string, at: Date): Promise<ZipRateResult> {
    this.validateGetRatesInputTime(at);

    const zipInfo = await this.getZipInfoOrThrow(zip);
    const cityIds = this.extractCityIds(zipInfo, zip);
    const whereClauses = this.buildRateWhereClauses(zipInfo, cityIds);

    const rates = await this.fetchCandidateRates(at, whereClauses);
    const { stateRate, countyRate, cityRatesById } = this.pickEffectiveRates(
      rates,
      cityIds,
    );

    this.assertAllComponentsPresent(
      zip,
      zipInfo,
      at,
      stateRate,
      countyRate,
      cityRatesById,
      cityIds,
    );

    const cityRates = cityIds
      .map((cityId) => cityRatesById.get(cityId))
      .filter((rate): rate is tax_rates => Boolean(rate));

    const maxCityRate = this.computeMaxCityRate(cityRates);
    return this.buildResponse(
      stateRate as tax_rates,
      countyRate as tax_rates,
      cityRates,
      maxCityRate,
      zipInfo,
    );
  }

  async getCurrentActiveRates(
    query: GetCurrentTaxRatesQueryDto,
  ): Promise<CurrentTaxRatesResponse> {
    const now = new Date();
    const rates = await this.prisma.tax_rates.findMany({
      where: { start_time: { lte: now } },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
      include: {
        cities: {
          select: { city_name: true },
        },
      },
    });

    const cityZipCodesById = await this.getCityZipCodesMap(rates);

    const seen = new Set<string>();
    const stateItems: CurrentTaxRateItem[] = [];
    const countyItems: CurrentTaxRateItem[] = [];
    const cityItems: CurrentTaxRateItem[] = [];

    for (const rate of rates) {
      const key = this.getCurrentRateIdentityKey(rate);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const item = this.toCurrentTaxRateItem(rate, cityZipCodesById);
      if (rate.jurisdiction_type === JurisdictionType.STATE) {
        stateItems.push(item);
      } else if (rate.jurisdiction_type === JurisdictionType.COUNTY) {
        countyItems.push(item);
      } else {
        cityItems.push(item);
      }
    }

    const statePage = this.paginateCurrentSection(stateItems, {
      include: query.includeState ?? true,
      skip: query.stateSkip ?? 0,
      take: query.stateTake,
    });
    const countyPage = this.paginateCurrentSection(countyItems, {
      include: query.includeCounty ?? true,
      skip: query.countySkip ?? 0,
      take: query.countyTake,
    });
    const cityPage = this.paginateCurrentSection(cityItems, {
      include: query.includeCity ?? true,
      skip: query.citySkip ?? 0,
      take: query.cityTake,
    });

    return {
      as_of: now.toISOString(),
      state: statePage.items,
      county: countyPage.items,
      city: cityPage.items,
      pagination: {
        state: statePage.pagination,
        county: countyPage.pagination,
        city: cityPage.pagination,
      },
    };
  }

  private normalizeCreateDto(dto: CreateTaxRateDto): NormalizedCreateDto {
    return {
      stateCode: dto.stateCode.trim().toUpperCase(),
      countyName: dto.countyName?.trim() || null,
      cityName: dto.cityName?.trim() || null,
      startTime: new Date(dto.startTime),
      rateDecimal: new Prisma.Decimal(dto.rate),
    };
  }

  private validateCreateDto(
    normalized: NormalizedCreateDto,
    jurisdictionType: JurisdictionType,
    cityId?: number,
  ): void {
    if (Number.isNaN(normalized.startTime.getTime())) {
      throw new BadRequestException('startTime must be a valid ISO timestamp');
    }

    if (jurisdictionType === JurisdictionType.STATE) {
      if (normalized.countyName || cityId || normalized.cityName) {
        throw new BadRequestException(
          'STATE rates must not include county or city identifiers',
        );
      }
    }

    if (jurisdictionType === JurisdictionType.COUNTY) {
      if (!normalized.countyName) {
        throw new BadRequestException('COUNTY rates require countyName');
      }
      if (cityId || normalized.cityName) {
        throw new BadRequestException(
          'COUNTY rates must not include city identifiers',
        );
      }
    }

    if (jurisdictionType === JurisdictionType.CITY) {
      if (normalized.countyName) {
        throw new BadRequestException('CITY rates must not include countyName');
      }
      if (cityId && normalized.cityName) {
        throw new BadRequestException(
          'Provide either cityId or cityName, not both',
        );
      }
      if (!cityId && !normalized.cityName) {
        throw new BadRequestException('CITY rates require cityId or cityName');
      }
    }
  }

  private async resolveCityIdForCreate(
    jurisdictionType: JurisdictionType,
    normalized: NormalizedCreateDto,
    cityId?: number,
  ): Promise<bigint | null> {
    if (jurisdictionType !== JurisdictionType.CITY) {
      return null;
    }

    if (cityId !== undefined) {
      if (!Number.isInteger(cityId) || cityId <= 0) {
        throw new BadRequestException('cityId must be a positive integer');
      }
      const city = await this.prisma.cities.findUnique({
        where: { id: BigInt(cityId) },
      });
      if (!city) {
        throw new BadRequestException('City not found for cityId');
      }
      if (city.state_code !== normalized.stateCode) {
        throw new BadRequestException(
          'cityId does not belong to the provided stateCode',
        );
      }
      return city.id;
    }

    if (normalized.cityName) {
      const city = await this.prisma.cities.findUnique({
        where: {
          state_code_city_name: {
            state_code: normalized.stateCode,
            city_name: normalized.cityName,
          },
        },
      });
      if (!city) {
        throw new BadRequestException('City not found for cityName');
      }
      return city.id;
    }

    return null;
  }

  private async assertStateExists(stateCode: string): Promise<void> {
    const count = await this.prisma.zip_codes.count({
      where: { state_code: stateCode },
    });
    if (count === 0) {
      throw new BadRequestException(`State not found for ${stateCode}`);
    }
  }

  private async assertCountyExists(
    stateCode: string,
    countyName: string,
  ): Promise<void> {
    const count = await this.prisma.zip_codes.count({
      where: { state_code: stateCode, county_name: countyName },
    });
    if (count === 0) {
      throw new BadRequestException(
        `County not found for ${stateCode} ${countyName}`,
      );
    }
  }

  private async createTaxRateRow(
    data: Prisma.tax_ratesCreateInput,
  ): Promise<tax_rates> {
    try {
      return await this.prisma.tax_rates.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Rate version already exists for startTime',
        );
      }
      throw error;
    }
  }

  private validateGetRatesInputTime(at: Date): void {
    if (Number.isNaN(at.getTime())) {
      throw new BadRequestException('at must be a valid ISO timestamp');
    }
  }

  private async getZipInfoOrThrow(zip: string): Promise<ZipInfo> {
    const zipInfo = await this.geographyService.getZipCode(zip);
    if (!zipInfo.county_name) {
      throw new NotFoundException(`County not found for zip ${zip}`);
    }
    return zipInfo;
  }

  private extractCityIds(zipInfo: ZipInfo, zip: string): bigint[] {
    const cityIds = Array.from(
      new Set(zipInfo.zip_cities.map((item) => item.city_id)),
    );
    if (cityIds.length === 0) {
      throw new NotFoundException(`No cities found for zip ${zip}`);
    }
    return cityIds;
  }

  private buildRateWhereClauses(
    zipInfo: ZipInfo,
    cityIds: bigint[],
  ): Prisma.tax_ratesWhereInput[] {
    return [
      {
        jurisdiction_type: JurisdictionType.STATE,
        state_code: zipInfo.state_code,
      },
      {
        jurisdiction_type: JurisdictionType.COUNTY,
        state_code: zipInfo.state_code,
        county_name: zipInfo.county_name,
      },
      {
        jurisdiction_type: JurisdictionType.CITY,
        state_code: zipInfo.state_code,
        city_id: { in: cityIds },
      },
    ];
  }

  private async fetchCandidateRates(
    at: Date,
    whereClauses: Prisma.tax_ratesWhereInput[],
  ): Promise<tax_rates[]> {
    return this.prisma.tax_rates.findMany({
      where: {
        start_time: { lte: at },
        OR: whereClauses,
      },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });
  }

  private pickEffectiveRates(
    rates: tax_rates[],
    cityIds: bigint[],
  ): EffectiveRates {
    let stateRate: tax_rates | null = null;
    let countyRate: tax_rates | null = null;
    const cityRatesById = new Map<bigint, tax_rates>();

    for (const rate of rates) {
      if (rate.jurisdiction_type === JurisdictionType.STATE && !stateRate) {
        stateRate = rate;
      } else if (
        rate.jurisdiction_type === JurisdictionType.COUNTY &&
        !countyRate
      ) {
        countyRate = rate;
      } else if (
        rate.jurisdiction_type === JurisdictionType.CITY &&
        rate.city_id !== null
      ) {
        if (!cityRatesById.has(rate.city_id)) {
          cityRatesById.set(rate.city_id, rate);
        }
      }
      if (stateRate && countyRate && cityRatesById.size === cityIds.length) {
        break;
      }
    }

    return { stateRate, countyRate, cityRatesById };
  }

  private assertAllComponentsPresent(
    zip: string,
    zipInfo: ZipInfo,
    at: Date,
    stateRate: tax_rates | null,
    countyRate: tax_rates | null,
    cityRatesById: Map<bigint, tax_rates>,
    cityIds: bigint[],
  ): void {
    const timestamp = this.formatTimestamp(at);
    if (!stateRate) {
      throw new NotFoundException(
        `State rate not found for ${zipInfo.state_code} at ${timestamp}`,
      );
    }
    if (!countyRate) {
      throw new NotFoundException(
        `County rate not found for ${zipInfo.state_code} ${zipInfo.county_name} at ${timestamp}`,
      );
    }
    if (cityRatesById.size !== cityIds.length) {
      throw new NotFoundException(
        `City rate not found for all cities in zip ${zip} at ${timestamp}`,
      );
    }
  }

  private computeMaxCityRate(cityRates: tax_rates[]): tax_rates {
    if (cityRates.length === 0) {
      throw new NotFoundException('City rate not found');
    }
    let maxRate = cityRates[0];
    for (const rate of cityRates) {
      maxRate =
        this.decimalMax(rate.rate, maxRate.rate) === rate.rate ? rate : maxRate;
    }
    return maxRate;
  }

  private buildResponse(
    stateRate: tax_rates,
    countyRate: tax_rates,
    cityRates: tax_rates[],
    maxCityRate: tax_rates,
    zipInfo: ZipInfo,
  ): ZipRateResult {
    const cityNameById = new Map<bigint, string | null>();
    for (const zipCity of zipInfo.zip_cities) {
      cityNameById.set(zipCity.city_id, zipCity.cities?.city_name ?? null);
    }

    const maxCityInfo =
      maxCityRate.city_id !== null
        ? {
            city_id: maxCityRate.city_id.toString(),
            city_name: cityNameById.get(maxCityRate.city_id) ?? null,
          }
        : undefined;

    // Total = state + county + max(city).
    const totalRate = stateRate.rate
      .plus(countyRate.rate)
      .plus(maxCityRate.rate)
      .toString();

    return {
      state: this.toTaxRateResponse(stateRate),
      county: this.toTaxRateResponse(countyRate),
      city: cityRates.map((rate) =>
        this.toTaxRateResponse(
          rate,
          rate.city_id !== null
            ? (cityNameById.get(rate.city_id) ?? null)
            : null,
        ),
      ),
      total_rate: totalRate,
      breakdown: {
        state_rate: stateRate.rate.toString(),
        county_rate: countyRate.rate.toString(),
        max_city_rate: maxCityRate.rate.toString(),
        max_city: maxCityInfo,
      },
    };
  }

  private decimalMax(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
    return a.greaterThan(b) ? a : b;
  }

  private async getCityZipCodesMap(
    rates: TaxRateWithCity[],
  ): Promise<Map<bigint, string[]>> {
    const cityIds = Array.from(
      new Set(
        rates
          .filter(
            (rate) =>
              rate.jurisdiction_type === JurisdictionType.CITY &&
              rate.city_id !== null,
          )
          .map((rate) => rate.city_id as bigint),
      ),
    );

    if (cityIds.length === 0) {
      return new Map();
    }

    const cityZipRows = await this.prisma.zip_cities.findMany({
      where: { city_id: { in: cityIds } },
      select: { city_id: true, zip: true },
      orderBy: [{ city_id: 'asc' }, { zip: 'asc' }],
    });

    const zipCodesByCity = new Map<bigint, string[]>();
    for (const row of cityZipRows) {
      const existing = zipCodesByCity.get(row.city_id) ?? [];
      if (!existing.includes(row.zip)) {
        existing.push(row.zip);
      }
      zipCodesByCity.set(row.city_id, existing);
    }

    return zipCodesByCity;
  }

  private getCurrentRateIdentityKey(rate: tax_rates): string {
    if (rate.jurisdiction_type === JurisdictionType.STATE) {
      return `STATE|${rate.state_code}`;
    }
    if (rate.jurisdiction_type === JurisdictionType.COUNTY) {
      return `COUNTY|${rate.state_code}|${rate.county_name ?? ''}`;
    }
    return `CITY|${rate.state_code}|${rate.city_id?.toString() ?? ''}`;
  }

  private toCurrentTaxRateItem(
    rate: TaxRateWithCity,
    cityZipCodesById: Map<bigint, string[]>,
  ): CurrentTaxRateItem {
    const base: CurrentTaxRateItem = {
      jurisdiction_type: rate.jurisdiction_type,
      state_code: rate.state_code,
      rate_percent: rate.rate.mul(100).toString(),
      start_time: rate.start_time.toISOString(),
    };

    if (rate.county_name) {
      base.county_name = rate.county_name;
    }

    if (rate.city_id !== null) {
      base.city_id = rate.city_id.toString();
      base.city_name = rate.cities?.city_name ?? null;
      base.zip_codes = cityZipCodesById.get(rate.city_id) ?? [];
    }

    return base;
  }

  private paginateCurrentSection(
    items: CurrentTaxRateItem[],
    options: {
      include: boolean;
      skip: number;
      take?: number;
    },
  ): CurrentSectionPageResult {
    if (!options.include) {
      return {
        items: [],
        pagination: {
          included: false,
          enabled: false,
          total: 0,
          skip: 0,
          take: null,
          has_more: false,
        },
      };
    }

    const total = items.length;
    const skip = Math.max(0, options.skip);

    if (options.take === undefined) {
      return {
        items,
        pagination: {
          included: true,
          enabled: false,
          total,
          skip: 0,
          take: null,
          has_more: false,
        },
      };
    }

    const take = Math.max(1, options.take);
    const pagedItems = items.slice(skip, skip + take);

    return {
      items: pagedItems,
      pagination: {
        included: true,
        enabled: true,
        total,
        skip,
        take,
        has_more: skip + pagedItems.length < total,
      },
    };
  }

  private formatTimestamp(at: Date): string {
    return at.toISOString();
  }

  private toTaxRateResponse(
    rate: tax_rates,
    cityName: string | null = null,
  ): TaxRateResponse {
    return {
      id: rate.id.toString(),
      jurisdiction_type: rate.jurisdiction_type,
      state_code: rate.state_code,
      county_name: rate.county_name,
      city_id: rate.city_id !== null ? rate.city_id.toString() : null,
      city_name: cityName,
      rate: rate.rate.toString(),
      start_time: rate.start_time.toISOString(),
    };
  }
}
