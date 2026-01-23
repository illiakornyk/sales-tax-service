import { Prisma, tax_rates } from '../../generated/prisma/client';
import { jurisdiction_type } from '../../generated/prisma/enums';
import { ZipCodeWithCities } from '../../geography/types/geography.types';

export type ZipRateBreakdown = {
  state_rate: Prisma.Decimal;
  county_rate: Prisma.Decimal;
  max_city_rate: Prisma.Decimal;
  max_city?: {
    city_id: bigint;
    city_name: string | null;
  };
};

export type ZipRateResult = {
  state: TaxRateResponse;
  county: TaxRateResponse;
  city: TaxRateResponse[];
  total_rate: Prisma.Decimal;
  breakdown: ZipRateBreakdown;
};

export type TaxRateResponse = {
  id: bigint;
  jurisdiction_type: jurisdiction_type;
  state_code: string;
  county_name: string | null;
  city_id: bigint | null;
  rate: Prisma.Decimal;
  start_time: Date;
};

export type NormalizedCreateDto = {
  stateCode: string;
  countyName: string | null;
  cityName: string | null;
  startTime: Date;
  rateDecimal: Prisma.Decimal;
};

export type ZipInfo = ZipCodeWithCities;

export type EffectiveRates = {
  stateRate: tax_rates | null;
  countyRate: tax_rates | null;
  cityRatesById: Map<bigint, tax_rates>;
};
