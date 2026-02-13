'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import {
  LoadingInline,
  TableSkeletonRows,
} from '../../../components/LoadingState';
import { fetchJson, getApiBase } from '../../../lib/api';

const SECTION_PAGE_SIZE = 15;

type CurrentTaxRateItem = {
  jurisdiction_type: 'STATE' | 'COUNTY' | 'CITY' | string;
  state_code: string;
  county_name?: string;
  city_id?: string;
  city_name?: string | null;
  zip_codes?: string[];
  rate_percent: string;
  start_time: string;
};

type CurrentTaxRateSectionPagination = {
  included: boolean;
  enabled: boolean;
  total: number;
  skip: number;
  take: number | null;
  has_more: boolean;
};

type CurrentTaxRatesResponse = {
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

type RatesSectionKind = 'state' | 'county' | 'city';
type PaginationDirection = 'prev' | 'next';
type SectionSkips = Record<RatesSectionKind, number>;

export default function CurrentTaxRatesPage() {
  const [data, setData] = useState<CurrentTaxRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionSkips, setSectionSkips] = useState<SectionSkips>({
    state: 0,
    county: 0,
    city: 0,
  });

  const apiBase = getApiBase();

  const loadCurrentRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/tax-rates/current', apiBase);
      url.searchParams.set('stateSkip', String(sectionSkips.state));
      url.searchParams.set('stateTake', String(SECTION_PAGE_SIZE));
      url.searchParams.set('countySkip', String(sectionSkips.county));
      url.searchParams.set('countyTake', String(SECTION_PAGE_SIZE));
      url.searchParams.set('citySkip', String(sectionSkips.city));
      url.searchParams.set('cityTake', String(SECTION_PAGE_SIZE));

      const response = await fetchJson<CurrentTaxRatesResponse>(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.message}`);
      }
      setData(response.data ?? null);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load current rates.',
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase, sectionSkips.city, sectionSkips.county, sectionSkips.state]);

  useEffect(() => {
    void loadCurrentRates();
  }, [loadCurrentRates]);

  const handleSectionPagination = (
    kind: RatesSectionKind,
    direction: PaginationDirection,
  ) => {
    if (!data) {
      return;
    }

    const sectionPagination = data.pagination[kind];
    if (!sectionPagination.enabled || sectionPagination.take === null) {
      return;
    }

    const delta =
      direction === 'next' ? sectionPagination.take : -sectionPagination.take;
    const nextSkip = Math.max(0, sectionPagination.skip + delta);
    setSectionSkips((previous) => ({ ...previous, [kind]: nextSkip }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f4ff,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-12 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#111827,_#020617_40%,_#020617_70%)] dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Tax Rates
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Current active rates
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Shows latest active rows from tax rates per jurisdiction identity.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => void loadCurrentRates()}
            disabled={loading}
            className="h-10 px-5 text-sm font-semibold"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </header>

        {error ? (
          <Alert variant="error">
            <span>{error}</span>
          </Alert>
        ) : null}

        {loading ? <LoadingInline label="Loading current rates..." /> : null}

        {data ? (
          <Card variant="light">
            <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-4">
              <div>
                <span className="text-slate-500">As of</span>
                <p className="font-medium">{toHumanDateTime(data.as_of)}</p>
              </div>
              <div>
                <span className="text-slate-500">State rates</span>
                <p className="font-medium">{data.pagination.state.total}</p>
              </div>
              <div>
                <span className="text-slate-500">County rates</span>
                <p className="font-medium">{data.pagination.county.total}</p>
              </div>
              <div>
                <span className="text-slate-500">City rates</span>
                <p className="font-medium">{data.pagination.city.total}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {loading && !data ? (
          <Card variant="light">
            <div className="mb-3 h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <table className="min-w-full divide-y-2 divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="ltr:text-left rtl:text-right">
                <tr className="*:font-medium *:text-gray-900 dark:*:text-white">
                  <th className="px-3 py-2 whitespace-nowrap">State</th>
                  <th className="px-3 py-2 whitespace-nowrap">Rate (%)</th>
                  <th className="px-3 py-2 whitespace-nowrap">Start Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <TableSkeletonRows
                  columns={3}
                  rows={4}
                  tone="light"
                  cellClassName="px-3 py-2 whitespace-nowrap"
                />
              </tbody>
            </table>
          </Card>
        ) : null}

        <div className="grid gap-6">
          <RatesSection
            kind="state"
            title="State"
            items={data?.state ?? []}
            pagination={data?.pagination.state}
            loading={loading}
            onPageChange={handleSectionPagination}
          />
          <RatesSection
            kind="county"
            title="County"
            items={data?.county ?? []}
            pagination={data?.pagination.county}
            loading={loading}
            onPageChange={handleSectionPagination}
          />
          <RatesSection
            kind="city"
            title="City"
            items={data?.city ?? []}
            pagination={data?.pagination.city}
            loading={loading}
            onPageChange={handleSectionPagination}
          />
        </div>
      </main>
    </div>
  );
}

function RatesSection({
  kind,
  title,
  items,
  pagination,
  loading,
  onPageChange,
}: {
  kind: RatesSectionKind;
  title: string;
  items: CurrentTaxRateItem[];
  pagination?: CurrentTaxRateSectionPagination;
  loading: boolean;
  onPageChange: (
    kind: RatesSectionKind,
    direction: PaginationDirection,
  ) => void;
}) {
  const [zipModal, setZipModal] = useState<{
    cityId: string;
    cityName: string;
    zipCodes: string[];
  } | null>(null);

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
                            setZipModal({
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
                      {toHumanDateTime(item.start_time)}
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
      {zipModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  ZIP Codes
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {zipModal.cityName} (City ID: {zipModal.cityId})
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setZipModal(null)}
                className="px-3 py-1 text-sm"
              >
                Close
              </Button>
            </div>
            <div className="mt-4 max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-sm text-slate-700 dark:text-slate-200">
                {zipModal.zipCodes.map((zip) => (
                  <span
                    key={zip}
                    className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-center dark:border-slate-700 dark:bg-slate-950"
                  >
                    {zip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function SectionPagination({
  pagination,
  loading,
  onPrev,
  onNext,
}: {
  pagination: CurrentTaxRateSectionPagination;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const take = pagination.take ?? SECTION_PAGE_SIZE;
  const currentPage =
    pagination.total === 0 ? 1 : Math.floor(pagination.skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / take));
  const prevDisabled = loading || pagination.skip <= 0;
  const nextDisabled = loading || !pagination.has_more;

  return (
    <ul className="flex justify-center gap-3 text-gray-900 dark:text-white">
      <li>
        <a
          href="#"
          aria-label="Previous page"
          onClick={(event) => {
            event.preventDefault();
            if (!prevDisabled) {
              onPrev();
            }
          }}
          className="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-gray-50 rtl:rotate-180 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-disabled={prevDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </li>

      <li className="text-sm/8 font-medium tracking-widest">
        {currentPage}/{totalPages}
      </li>

      <li>
        <a
          href="#"
          aria-label="Next page"
          onClick={(event) => {
            event.preventDefault();
            if (!nextDisabled) {
              onNext();
            }
          }}
          className="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-gray-50 rtl:rotate-180 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-disabled={nextDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </li>
    </ul>
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

function toHumanDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
