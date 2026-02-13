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

export type RatesSectionKind = 'state' | 'county' | 'city';
export type PaginationDirection = 'prev' | 'next';
export type SectionSkips = Record<RatesSectionKind, number>;

export type ZipModalState = {
  cityId: string;
  cityName: string;
  zipCodes: string[];
};
