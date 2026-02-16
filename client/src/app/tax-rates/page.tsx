'use client';

import { useState } from 'react';
import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField, FormInput } from '@/components/FormField';
import { LoadingInline } from '@/components/LoadingState';
import { PageShell } from '@/components/PageShell';
import { TaxRateIndicator } from '@/components/TaxRateIndicator';
import { fetchJson, getApiBase } from '@/lib/api';
import { dateTimeLocalToIso, isoToDateTimeLocal } from '@/lib/datetime';
import { taxRatesByZipUrl } from '@/lib/endpoints';
import { formatDateTime, formatRate } from '@/lib/format';
import type { ZipRateResult } from '@/types/tax-rates';

const ZIP_REGEX = /^\d{5}$/;
const detailCardClass =
  'rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40 max-[425px]:rounded-lg max-[425px]:p-3';

export default function TaxRatesLookupPage() {
  const [zip, setZip] = useState('');
  const [atIso, setAtIso] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ZipRateResult | null>(null);

  const apiBase = getApiBase();

  const parsedAt = new Date(atIso);
  const atIsValid = !Number.isNaN(parsedAt.getTime());
  const localDateTimeValue = isoToDateTimeLocal(atIso);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!ZIP_REGEX.test(zip)) {
      setError('ZIP code must be 5 digits.');
      return;
    }
    if (!atIsValid) {
      setError('Please provide a valid timestamp.');
      return;
    }

    setLoading(true);
    try {
      const url = taxRatesByZipUrl(apiBase, {
        zip,
        atIso: parsedAt.toISOString(),
      });

      const response = await fetchJson<ZipRateResult>(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.message}`);
      }

      setResult(response.data ?? null);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Request failed.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      className="max-[425px]:px-3 max-[425px]:py-6"
      mainClassName="max-w-4xl max-[425px]:gap-4"
    >
      <header className="max-[425px]:space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-500">
          Client Query
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight max-[425px]:mt-1 max-[425px]:text-2xl">
          Calculate tax rate by ZIP
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 max-[425px]:mt-2 max-[425px]:text-xs">
          Enter a ZIP code and a timestamp to retrieve the effective tax
          breakdown.
        </p>
      </header>

      <Card variant="dark" className="max-[425px]:p-4">
        <form className="grid gap-5 max-[425px]:gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-4 max-[425px]:gap-2.5 md:grid-cols-3">
            <FormField label="ZIP code">
              <FormInput
                value={zip}
                onChange={(event) => setZip(event.target.value.trim())}
                inputMode="numeric"
                maxLength={5}
                placeholder="05079"
                className="max-[425px]:text-sm"
              />
            </FormField>
            <FormField label="Timestamp (ISO-8601)">
              <FormInput
                value={atIso}
                onChange={(event) => setAtIso(event.target.value)}
                className="max-[425px]:text-sm"
              />
            </FormField>
            <FormField label="Timestamp (picker)">
              <FormInput
                value={localDateTimeValue}
                onChange={(event) => {
                  const isoValue = dateTimeLocalToIso(event.target.value);
                  if (isoValue) {
                    setAtIso(isoValue);
                  }
                }}
                type="datetime-local"
                className="max-[425px]:text-sm"
              />
            </FormField>
          </div>
          <div className="grid gap-4 max-[425px]:gap-2.5 md:grid-cols-1 md:items-end">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="h-10 px-6 text-sm font-semibold max-[425px]:h-9 max-[425px]:px-4 max-[425px]:text-xs"
            >
              {loading ? 'Calculating...' : 'Calculate'}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 max-[425px]:mt-3">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}
        {loading ? (
          <div className="mt-4 max-[425px]:mt-3">
            <LoadingInline label="Calculating effective tax rates..." />
          </div>
        ) : null}
      </Card>

      {result ? (
        <section className="grid gap-6 max-[425px]:gap-4">
          <Card variant="dark" className="max-[425px]:p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Total Rate
            </p>
            <div className="mt-2 text-4xl font-semibold max-[425px]:text-3xl">
              {formatRate(result.total_rate)}
            </div>
            <TaxRateIndicator rate={result.total_rate} className="mt-3" />
            <div className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300 max-[425px]:mt-3 max-[425px]:text-xs">
              <div className="flex justify-between">
                <span>State</span>
                <span>{formatRate(result.breakdown.state_rate)}</span>
              </div>
              <div className="flex justify-between">
                <span>County</span>
                <span>{formatRate(result.breakdown.county_rate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Max city</span>
                <span>{formatRate(result.breakdown.max_city_rate)}</span>
              </div>
              {result.breakdown.max_city ? (
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 max-[425px]:text-[11px]">
                  <span>City</span>
                  <span>
                    {result.breakdown.max_city.city_name} (
                    {result.breakdown.max_city.city_id})
                  </span>
                </div>
              ) : null}
            </div>
          </Card>

          <Card variant="dark" className="max-[425px]:p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Rate details
            </h2>
            <div className="mt-4 grid gap-4 text-sm text-slate-700 dark:text-slate-300 max-[425px]:mt-3 max-[425px]:gap-3 max-[425px]:text-xs">
              {[result.state, result.county].map((row) => (
                <div key={row.id} className={detailCardClass}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500">
                      {row.jurisdiction_type}
                    </span>
                    <span className="text-sm font-semibold max-[425px]:text-xs">
                      {formatRate(row.rate)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 max-[425px]:mt-1">
                    {row.state_code}
                    {row.county_name ? ` · ${row.county_name}` : ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    Start {formatDateTime(row.start_time)}
                  </div>
                  <TaxRateIndicator rate={row.rate} compact className="mt-3" />
                </div>
              ))}
              <div className={detailCardClass}>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500">
                  CITY
                </div>
                <div className="mt-3 grid gap-2 max-[425px]:mt-2">
                  {result.city.map((row) => (
                    <div key={row.id}>
                      <div className="flex items-center justify-between gap-3 text-sm max-[425px]:items-start max-[425px]:text-xs">
                        <span className="text-slate-700 dark:text-slate-300 max-[425px]:break-words">
                          {row.city_name
                            ? `${row.city_name} (City ID ${row.city_id ?? '—'})`
                            : `City ID ${row.city_id ?? '—'}`}
                        </span>
                        <span className="font-semibold">
                          {formatRate(row.rate)}
                        </span>
                      </div>
                      <TaxRateIndicator
                        rate={row.rate}
                        compact
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      ) : null}
    </PageShell>
  );
}
