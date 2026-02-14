export type ZipRateRow = {
  id: string;
  jurisdiction_type: string;
  state_code: string;
  county_name: string | null;
  city_id: string | null;
  city_name?: string | null;
  rate: string;
  start_time: string;
};

export type ZipRateResult = {
  state: ZipRateRow;
  county: ZipRateRow;
  city: ZipRateRow[];
  total_rate: string;
  breakdown: {
    state_rate: string;
    county_rate: string;
    max_city_rate: string;
    max_city?: { city_id: string; city_name: string } | null;
  };
};

export type CurrentTaxRateItem = {
  jurisdiction_type: 'STATE' | 'COUNTY' | 'CITY' | string;
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
