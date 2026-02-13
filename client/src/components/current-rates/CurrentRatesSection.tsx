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
  return (
    <Card variant="light">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No active records.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="ltr:text-left rtl:text-right">
                <tr className="*:font-medium *:text-gray-900 dark:*:text-white">
                  <th className="px-3 py-2 whitespace-nowrap">State</th>
                  {kind === 'county' ? (
                    <th className="px-3 py-2 whitespace-nowrap">County</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className="px-3 py-2 whitespace-nowrap">City ID</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className="px-3 py-2 whitespace-nowrap">City Name</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className="px-3 py-2 whitespace-nowrap">ZIP Count</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className="px-3 py-2 whitespace-nowrap">ZIP Preview</th>
                  ) : null}
                  {kind === 'city' ? (
                    <th className="px-3 py-2 whitespace-nowrap">ZIP List</th>
                  ) : null}
                  <th className="px-3 py-2 whitespace-nowrap">Rate (%)</th>
                  <th className="px-3 py-2 whitespace-nowrap">Start Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={getRowKey(item)}
                    className="*:text-gray-900 *:first:font-medium dark:*:text-white"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.state_code}
                    </td>
                    {kind === 'county' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.county_name ?? '—'}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.city_id ?? '—'}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.city_name ?? '—'}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.zip_codes?.length ?? 0}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatZipPreview(item.zip_codes ?? [])}
                      </td>
                    ) : null}
                    {kind === 'city' ? (
                      <td className="px-3 py-2 whitespace-nowrap">
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
                          className="px-2 py-1 text-xs"
                        >
                          View all
                        </Button>
                      </td>
                    ) : null}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {toPercent(item.rate_percent)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
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
