import { cities, zip_cities, zip_codes } from '../../generated/prisma/client';

export type ZipCityWithCity = zip_cities & { cities: cities | null };

export type ZipCodeWithCities = zip_codes & {
  zip_cities: ZipCityWithCity[];
};

export type ZipCodeSummary = Pick<
  zip_codes,
  'zip' | 'state_code' | 'county_name' | 'primary_city_name'
>;
