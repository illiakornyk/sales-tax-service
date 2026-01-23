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

type ZipRateBreakdown = {
  state_rate: Prisma.Decimal;
  county_rate: Prisma.Decimal;
  max_city_rate: Prisma.Decimal;
  max_city?: {
    city_id: bigint;
    city_name: string | null;
  };
};

type ZipRateResult = {
  state: tax_rates;
  county: tax_rates;
  city: tax_rates[];
  total_rate: Prisma.Decimal;
  breakdown: ZipRateBreakdown;
};

@Injectable()
export class TaxRatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geographyService: GeographyService,
  ) {}

  async createTaxRateVersion(dto: CreateTaxRateDto): Promise<tax_rates> {
    const stateCode = dto.stateCode.trim().toUpperCase();
    const countyName = dto.countyName?.trim() || null;
    const cityName = dto.cityName?.trim() || null;
    const startTime = new Date(dto.startTime);

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('startTime must be a valid ISO timestamp');
    }

    if (dto.jurisdictionType === JurisdictionType.STATE) {
      if (countyName || dto.cityId || cityName) {
        throw new BadRequestException(
          'STATE rates must not include county or city identifiers',
        );
      }
    }

    if (dto.jurisdictionType === JurisdictionType.COUNTY) {
      if (!countyName) {
        throw new BadRequestException('COUNTY rates require countyName');
      }
      if (dto.cityId || cityName) {
        throw new BadRequestException(
          'COUNTY rates must not include city identifiers',
        );
      }
    }

    let cityId: bigint | null = null;
    if (dto.jurisdictionType === JurisdictionType.CITY) {
      if (countyName) {
        throw new BadRequestException('CITY rates must not include countyName');
      }
      if (dto.cityId && cityName) {
        throw new BadRequestException(
          'Provide either cityId or cityName, not both',
        );
      }
      if (!dto.cityId && !cityName) {
        throw new BadRequestException('CITY rates require cityId or cityName');
      }

      if (dto.cityId) {
        if (!Number.isInteger(dto.cityId) || dto.cityId <= 0) {
          throw new BadRequestException('cityId must be a positive integer');
        }
        const city = await this.prisma.cities.findUnique({
          where: { id: BigInt(dto.cityId) },
        });
        if (!city) {
          throw new BadRequestException('City not found for cityId');
        }
        if (city.state_code !== stateCode) {
          throw new BadRequestException(
            'cityId does not belong to the provided stateCode',
          );
        }
        cityId = city.id;
      } else if (cityName) {
        const city = await this.prisma.cities.findUnique({
          where: {
            state_code_city_name: {
              state_code: stateCode,
              city_name: cityName,
            },
          },
        });
        if (!city) {
          throw new BadRequestException('City not found for cityName');
        }
        cityId = city.id;
      }
    }

    try {
      return await this.prisma.tax_rates.create({
        data: {
          jurisdiction_type: dto.jurisdictionType,
          state_code: stateCode,
          county_name: countyName,
          city_id: cityId,
          rate: new Prisma.Decimal(dto.rate),
          start_time: startTime,
          created_by_user_id: null,
        },
      });
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

  async getRatesByZip(zip: string, at: Date): Promise<ZipRateResult> {
    const zipInfo = await this.geographyService.getZipCode(zip);
    if (!zipInfo) {
      throw new NotFoundException(`Zip code ${zip} not found`);
    }

    if (!zipInfo.county_name) {
      throw new NotFoundException(`County not found for zip ${zip}`);
    }

    const cityIds = Array.from(
      new Set(zipInfo.zip_cities.map((item) => item.city_id)),
    );
    if (cityIds.length === 0) {
      throw new NotFoundException(`No cities found for zip ${zip}`);
    }

    const whereClauses: Prisma.tax_ratesWhereInput[] = [
      { jurisdiction_type: 'STATE', state_code: zipInfo.state_code },
      {
        jurisdiction_type: 'COUNTY',
        state_code: zipInfo.state_code,
        county_name: zipInfo.county_name,
      },
      {
        jurisdiction_type: 'CITY',
        state_code: zipInfo.state_code,
        city_id: { in: cityIds },
      },
    ];

    const rates = await this.prisma.tax_rates.findMany({
      where: {
        start_time: { lte: at },
        OR: whereClauses,
      },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    let stateRate: tax_rates | null = null;
    let countyRate: tax_rates | null = null;
    const cityRatesById = new Map<bigint, tax_rates>();

    for (const rate of rates) {
      if (rate.jurisdiction_type === 'STATE' && !stateRate) {
        stateRate = rate;
      } else if (rate.jurisdiction_type === 'COUNTY' && !countyRate) {
        countyRate = rate;
      } else if (rate.jurisdiction_type === 'CITY' && rate.city_id !== null) {
        if (!cityRatesById.has(rate.city_id)) {
          cityRatesById.set(rate.city_id, rate);
        }
      }
      if (stateRate && countyRate && cityRatesById.size === cityIds.length) {
        break;
      }
    }

    if (!stateRate) {
      throw new NotFoundException(
        `State rate not found for ${zipInfo.state_code} at ${at.toISOString()}`,
      );
    }
    if (!countyRate) {
      throw new NotFoundException(
        `County rate not found for ${zipInfo.state_code} ${zipInfo.county_name} at ${at.toISOString()}`,
      );
    }
    if (cityRatesById.size !== cityIds.length) {
      throw new NotFoundException(
        `City rate not found for all cities in zip ${zip} at ${at.toISOString()}`,
      );
    }

    const cityRates = cityIds
      .map((cityId) => cityRatesById.get(cityId))
      .filter((rate): rate is tax_rates => Boolean(rate));

    const cityNameById = new Map<bigint, string | null>();
    for (const zipCity of zipInfo.zip_cities) {
      cityNameById.set(zipCity.city_id, zipCity.cities?.city_name ?? null);
    }

    let maxCityRate = cityRates[0];
    for (const rate of cityRates) {
      if (rate.rate.greaterThan(maxCityRate.rate)) {
        maxCityRate = rate;
      }
    }

    const maxCityInfo =
      maxCityRate.city_id !== null
        ? {
            city_id: maxCityRate.city_id,
            city_name: cityNameById.get(maxCityRate.city_id) ?? null,
          }
        : undefined;

    const totalRate = stateRate.rate
      .plus(countyRate.rate)
      .plus(maxCityRate.rate);

    return {
      state: stateRate,
      county: countyRate,
      city: cityRates,
      total_rate: totalRate,
      breakdown: {
        state_rate: stateRate.rate,
        county_rate: countyRate.rate,
        max_city_rate: maxCityRate.rate,
        max_city: maxCityInfo,
      },
    };
  }
}
