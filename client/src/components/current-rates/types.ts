import type {
  CurrentTaxRateItem,
  CurrentTaxRateSectionPagination,
} from '@/types/tax-rates';

export type { CurrentTaxRateItem, CurrentTaxRateSectionPagination };

export type RatesSectionKind = 'state' | 'county' | 'city';
export type PaginationDirection = 'prev' | 'next';
export type SectionSkips = Record<RatesSectionKind, number>;

export type ZipModalState = {
  cityId: string;
  cityName: string;
  zipCodes: string[];
};
