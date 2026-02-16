import Image from 'next/image';
import { Button } from '../Button';
import { Card } from '../Card';
import { formatDateTime } from '@/lib/format';
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

type ColumnDef = {
  key: string;
  header: string;
  cellClassName?: string;
  render: (item: CurrentTaxRateItem) => React.ReactNode;
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
  const columns = buildColumns(kind, tableCellClass, onOpenZipModal);

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
                  {columns.map((column) => (
                    <th key={column.key} className={tableCellClass}>
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={getRowKey(item)}
                    className="*:text-gray-900 *:first:font-medium dark:*:text-white"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${getRowKey(item)}:${column.key}`}
                        className={column.cellClassName ?? tableCellClass}
                      >
                        {column.render(item)}
                      </td>
                    ))}
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

function buildColumns(
  kind: RatesSectionKind,
  tableCellClass: string,
  onOpenZipModal: (value: ZipModalState) => void,
): ColumnDef[] {
  const columns: ColumnDef[] = [
    {
      key: 'state',
      header: 'State',
      render: (item) => item.state_code,
    },
  ];

  if (kind === 'county') {
    columns.push({
      key: 'county',
      header: 'County',
      render: (item) => item.county_name ?? '—',
    });
  }

  if (kind === 'city') {
    columns.push(
      {
        key: 'cityId',
        header: 'City ID',
        render: (item) => item.city_id ?? '—',
      },
      {
        key: 'cityName',
        header: 'City Name',
        cellClassName: `${tableCellClass} break-words`,
        render: (item) => item.city_name ?? '—',
      },
      {
        key: 'zipCount',
        header: 'ZIP Count',
        render: (item) => item.zip_codes?.length ?? 0,
      },
      {
        key: 'zipPreview',
        header: 'ZIP Preview',
        cellClassName: `${tableCellClass} break-words`,
        render: (item) => formatZipPreview(item.zip_codes ?? []),
      },
      {
        key: 'zipList',
        header: 'ZIP List',
        render: (item) => (
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
        ),
      },
    );
  }

  columns.push(
    {
      key: 'rate',
      header: 'Rate (%)',
      render: (item) => toPercent(item.rate_percent),
    },
    {
      key: 'startTime',
      header: 'Start Time',
      render: (item) => formatDateTime(item.start_time),
    },
  );

  return columns;
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
