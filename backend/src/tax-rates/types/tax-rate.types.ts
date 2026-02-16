import { Prisma, tax_rates } from '../../generated/prisma/client';
import { jurisdiction_type } from '../../generated/prisma/enums';
import { ZipCodeWithCities } from '../../geography/types/geography.types';

export type ZipRateBreakdown = {
  state_rate: string;
  county_rate: string;
  max_city_rate: string;
  max_city?: {
    city_id: string;
    city_name: string | null;
  };
};

export type ZipRateResult = {
  state: TaxRateResponse;
  county: TaxRateResponse;
  city: TaxRateResponse[];
  total_rate: string;
  breakdown: ZipRateBreakdown;
};

export type TaxRateResponse = {
  id: string;
  jurisdiction_type: jurisdiction_type;
  state_code: string;
  county_name: string | null;
  city_id: string | null;
  city_name?: string | null;
  rate: string;
  start_time: string;
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

export type CurrentTaxRateItem = {
  jurisdiction_type: jurisdiction_type;
  state_code: string;
  county_name?: string;
  city_id?: string;
  city_name?: string | null;
  zip_codes?: string[];
  rate_percent: string;
  start_time: string;
};

export type CurrentTaxRateSectionPagination = {
  included: boolean;
  enabled: boolean;
  total: number;
  skip: number;
  take: number | null;
  has_more: boolean;
};

export type CurrentTaxRatesResponse = {
  as_of: string;
  state: CurrentTaxRateItem[];
  county: CurrentTaxRateItem[];
  city: CurrentTaxRateItem[];
  pagination: {
    state: CurrentTaxRateSectionPagination;
    county: CurrentTaxRateSectionPagination;
    city: CurrentTaxRateSectionPagination;
  };
};
