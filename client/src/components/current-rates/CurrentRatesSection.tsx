import Image from 'next/image';
import { Button } from '../Button';
import { Card } from '../Card';
import { formatDateTime } from '../../lib/format';
import { SectionPagination } from './SectionPagination';
import type {
  CurrentTaxRateItem,
  CurrentTaxRateSectionPagination,
  PaginationDirection,
  RatesSectionKind,
  ZipModalState,
} from './types';

type CurrentRatesSectionProps = {
  kind: RatesSectionKind;
  title: string;
  items: CurrentTaxRateItem[];
  pagination?: CurrentTaxRateSectionPagination;
  loading: boolean;
  onPageChange: (
    kind: RatesSectionKind,
    direction: PaginationDirection,
  ) => void;
  onOpenZipModal: (value: ZipModalState) => void;
};

export function CurrentRatesSection({
  kind,
  title,
  items,
  pagination,
  loading,
  onPageChange,
  onOpenZipModal,
}: CurrentRatesSectionProps) {
  const tableCellClass =
    'px-3 py-2 whitespace-nowrap max-[1440px]:px-2 max-[1440px]:py-1.5 max-[1440px]:text-xs max-[1440px]:whitespace-normal max-[425px]:px-1.5 max-[425px]:py-1 max-[425px]:text-[11px]';

  return (
    <Card variant="light" className="min-w-0 max-[1440px]:p-4 max-[425px]:p-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 max-[425px]:text-xs max-[425px]:tracking-[0.2em] dark:text-slate-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No active records.
        </p>
      ) : (
        <div className="mt-4 space-y-4 max-[425px]:mt-3 max-[425px]:space-y-3">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="ltr:text-left rtl:text-right">
                <tr className="*:font-medium *:text-gray-900 dark:*:text-white">
                  <th className={tableCellClass}>State</th>
                  {kind === 'county' ? (
                    <th className={tableCellClass}>County</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className={tableCellClass}>City ID</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className={tableCellClass}>City Name</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className={tableCellClass}>ZIP Count</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className={tableCellClass}>ZIP Preview</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className={tableCellClass}>ZIP List</th>
                  ) : null}
                  <th className={tableCellClass}>Rate (%)</th>
                  <th className={tableCellClass}>Start Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={getRowKey(item)}
                    className="*:text-gray-900 *:first:font-medium dark:*:text-white"
                  >
                    <td className={tableCellClass}>{item.state_code}</td>
                    {kind === 'county' ? (
                      <td className={tableCellClass}>
                        {item.county_name ?? '—'}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className={tableCellClass}>{item.city_id ?? '—'}</td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className={`${tableCellClass} break-words`}>
                        {item.city_name ?? '—'}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className={tableCellClass}>
                        {item.zip_codes?.length ?? 0}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className={`${tableCellClass} break-words`}>
                        {formatZipPreview(item.zip_codes ?? [])}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className={tableCellClass}>
                        <Button
                          type="button"
                          variant="primary"
                          disabled={!item.zip_codes?.length}
                          onClick={() =>
                            onOpenZipModal({
                              cityId: item.city_id ?? '—',
                              cityName: item.city_name ?? '—',
                              zipCodes: item.zip_codes ?? [],
                            })
                          }
                          aria-label={`View all zip codes for ${item.city_name ?? item.city_id ?? 'city'}`}
                          className="px-2 py-1 text-xs max-[1440px]:px-1.5 max-[1440px]:py-0.5 max-[1440px]:text-[11px] max-[768px]:inline-grid max-[768px]:size-8 max-[768px]:place-items-center max-[768px]:p-0 max-[425px]:size-7"
                        >
                          <span className="max-[768px]:hidden">View all</span>
                          <Image
                            src="/view_icon.svg"
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            className="hidden max-[768px]:block max-[768px]:brightness-0 max-[768px]:invert"
                          />
                        </Button>
                      </td>
                    ) : null}
                    <td className={tableCellClass}>
                      {toPercent(item.rate_percent)}
                    </td>
                    <td className={tableCellClass}>
                      {formatDateTime(item.start_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination?.enabled ? (
            <SectionPagination
              pagination={pagination}
              loading={loading}
              onPrev={() => onPageChange(kind, 'prev')}
              onNext={() => onPageChange(kind, 'next')}
            />
          ) : null}
        </div>
      )}
    </Card>
  );
}

function getRowKey(item: CurrentTaxRateItem): string {
  return [
    item.jurisdiction_type,
    item.state_code,
    item.county_name ?? '',
    item.city_id ?? '',
  ].join('|');
}

function toPercent(value: string): string {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return `${numeric}%`;
}

function formatZipPreview(zipCodes: string[]): string {
  if (zipCodes.length === 0) {
    return '—';
  }

  const preview = zipCodes.slice(0, 3).join(', ');
  const remaining = zipCodes.length - 3;
  if (remaining <= 0) {
    return preview;
  }

  return `${preview} +${remaining} more`;
}
