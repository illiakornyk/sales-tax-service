'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Card } from '../../../components/Card';
import { fetchJson, getApiBase } from '../../../lib/api';

type CurrentTaxRateItem = {
  jurisdiction_type: 'STATE' | 'COUNTY' | 'CITY' | string;
  state_code: string;
  county_name?: string;
  city_id?: string;
  city_name?: string | null;
  rate_percent: string;
  start_time: string;
};

type CurrentTaxRatesResponse = {
  as_of: string;
  state: CurrentTaxRateItem[];
  county: CurrentTaxRateItem[];
  city: CurrentTaxRateItem[];
};

type RatesSectionKind = 'state' | 'county' | 'city';

export default function CurrentTaxRatesPage() {
  const [data, setData] = useState<CurrentTaxRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = getApiBase();

  const loadCurrentRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchJson<CurrentTaxRatesResponse>(
        `${apiBase}/tax-rates/current`,
        {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        },
      );

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
  }, [apiBase]);

  useEffect(() => {
    void loadCurrentRates();
  }, [loadCurrentRates]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Tax Rates
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Current active rates
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Shows latest active rows from tax rates per jurisdiction identity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCurrentRates()}
            disabled={loading}
            className="h-10 rounded-xl bg-slate-200 px-5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {error ? (
          <Alert variant="error">
            <span>{error}</span>
          </Alert>
        ) : null}

        {data ? (
          <Card variant="dark">
            <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-4">
              <div>
                <span className="text-slate-500">As of</span>
                <p className="font-medium">{toHumanDateTime(data.as_of)}</p>
              </div>
              <div>
                <span className="text-slate-500">State rates</span>
                <p className="font-medium">{data.state.length}</p>
              </div>
              <div>
                <span className="text-slate-500">County rates</span>
                <p className="font-medium">{data.county.length}</p>
              </div>
              <div>
                <span className="text-slate-500">City rates</span>
                <p className="font-medium">{data.city.length}</p>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-6">
          <RatesSection kind="state" title="State" items={data?.state ?? []} />
          <RatesSection
            kind="county"
            title="County"
            items={data?.county ?? []}
          />
          <RatesSection kind="city" title="City" items={data?.city ?? []} />
        </div>
      </main>
    </div>
  );
}

function RatesSection({
  kind,
  title,
  items,
}: {
  kind: RatesSectionKind;
  title: string;
  items: CurrentTaxRateItem[];
}) {
  return (
    <Card variant="dark">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No active records.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-3 py-2">State</th>
                {kind === 'county' ? (
                  <th className="px-3 py-2">County</th>
                ) : null}
                {kind === 'city' ? <th className="px-3 py-2">City ID</th> : null}
                {kind === 'city' ? (
                  <th className="px-3 py-2">City Name</th>
                ) : null}
                <th className="px-3 py-2">Rate (%)</th>
                <th className="px-3 py-2">Start Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {items.map((item) => (
                <tr key={getRowKey(item)}>
                  <td className="px-3 py-2">{item.state_code}</td>
                  {kind === 'county' ? (
                    <td className="px-3 py-2">{item.county_name ?? '—'}</td>
                  ) : null}
                  {kind === 'city' ? (
                    <td className="px-3 py-2">{item.city_id ?? '—'}</td>
                  ) : null}
                  {kind === 'city' ? (
                    <td className="px-3 py-2">{item.city_name ?? '—'}</td>
                  ) : null}
                  <td className="px-3 py-2">{toPercent(item.rate_percent)}</td>
                  <td className="px-3 py-2">{toHumanDateTime(item.start_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
