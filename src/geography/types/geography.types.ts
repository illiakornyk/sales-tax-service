import { cities, zip_cities, zip_codes } from '../../generated/prisma/client';

export type ZipCityWithCity = zip_cities & { cities: cities | null };

export type ZipCodeWithCities = zip_codes & {
  zip_cities: ZipCityWithCity[];
};
