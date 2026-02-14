'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CurrentRatesSection } from '../../../components/current-rates/CurrentRatesSection';
import { ZipCodesModal } from '../../../components/current-rates/ZipCodesModal';
import {
  LoadingInline,
  TableSkeletonRows,
} from '../../../components/LoadingState';
import { PageShell } from '../../../components/PageShell';
import { fetchJson, getApiBase } from '../../../lib/api';
import { currentTaxRatesUrl } from '../../../lib/endpoints';
import { formatDateTime } from '../../../lib/format';
import type { CurrentTaxRatesResponse } from '../../../types/tax-rates';
import type {
  PaginationDirection,
  RatesSectionKind,
  SectionSkips,
  ZipModalState,
} from '../../../components/current-rates/types';

const SECTION_PAGE_SIZE = 15;

export default function CurrentTaxRatesPage() {
  const [data, setData] = useState<CurrentTaxRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipModal, setZipModal] = useState<ZipModalState | null>(null);
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
      const url = currentTaxRatesUrl(apiBase, {
        stateSkip: sectionSkips.state,
        stateTake: SECTION_PAGE_SIZE,
        countySkip: sectionSkips.county,
        countyTake: SECTION_PAGE_SIZE,
        citySkip: sectionSkips.city,
        cityTake: SECTION_PAGE_SIZE,
      });

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
    <PageShell mainClassName="max-w-6xl">
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
                <p className="font-medium">{formatDateTime(data.as_of)}</p>
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
          <CurrentRatesSection
            kind="state"
            title="State"
            items={data?.state ?? []}
            pagination={data?.pagination.state}
            loading={loading}
            onPageChange={handleSectionPagination}
            onOpenZipModal={setZipModal}
          />
          <CurrentRatesSection
            kind="county"
            title="County"
            items={data?.county ?? []}
            pagination={data?.pagination.county}
            loading={loading}
            onPageChange={handleSectionPagination}
            onOpenZipModal={setZipModal}
          />
          <CurrentRatesSection
            kind="city"
            title="City"
            items={data?.city ?? []}
            pagination={data?.pagination.city}
            loading={loading}
            onPageChange={handleSectionPagination}
            onOpenZipModal={setZipModal}
          />
        </div>
      
      {zipModal ? (
        <ZipCodesModal
          cityId={zipModal.cityId}
          cityName={zipModal.cityName}
          zipCodes={zipModal.zipCodes}
          onClose={() => setZipModal(null)}
        />
      ) : null}
    </PageShell>
  );
}
