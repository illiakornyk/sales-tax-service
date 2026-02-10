'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { LoadingInline, TableSkeletonRows } from '../components/LoadingState';
import { useStateCodes } from '../hooks/use-state-codes';
import { fetchJson, getApiBase } from '../lib/api';

type ZipSummary = {
  zip: string;
  state_code: string;
  county_name: string | null;
  primary_city_name: string | null;
};

const DEFAULT_STATE = 'CA';
const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 50;

export default function Home() {
  const [stateCode, setStateCode] = useState(DEFAULT_STATE);
  const [skip, setSkip] = useState(DEFAULT_SKIP);
  const [take, setTake] = useState(DEFAULT_TAKE);
  const [rows, setRows] = useState<ZipSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { states, error: statesError, loading: statesLoading } = useStateCodes();

  const apiBase = getApiBase();

  const normalizedStateCode = stateCode.trim().toUpperCase();

  const fetchRows = useCallback(async () => {
    if (!normalizedStateCode) {
      setError('State code is required.');
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/geography/state/${normalizedStateCode}`, apiBase);
      url.searchParams.set('skip', String(skip));
      url.searchParams.set('take', String(take));

      const response = await fetchJson<ZipSummary[]>(url, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      const payload = response.data ?? [];
      setRows(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'Unknown error while loading ZIP data.';
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, normalizedStateCode, skip, take]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const currentPage = Math.floor(skip / take) + 1;
  const hasPrev = skip > 0;
  const hasNext = rows.length === take;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f4ff,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-12 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 font-sans">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
            Geography Explorer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Browse ZIPs by state
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Pulling data from the backend endpoint{' '}
            <span className="font-medium text-slate-800">
              /geography/state/:stateCode
            </span>
            . Update the filters below and reload to view ZIP summaries.
          </p>
        </header>

        <Card variant="light">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
            <FormField
              label="State code"
              error={statesError}
              errorClassName="text-rose-500"
              className="text-slate-700"
              hintClassName="text-slate-400"
            >
              <select
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
                disabled={statesLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">
                  {statesLoading ? 'Loading states...' : 'Select a state'}
                </option>
                {states.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Page size" className="text-slate-700">
              <input
                value={take}
                onChange={(event) => {
                  const nextTake = Number(event.target.value);
                  if (Number.isFinite(nextTake) && nextTake > 0) {
                    setTake(nextTake);
                    setSkip(0);
                  }
                }}
                type="number"
                min={1}
                max={250}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Skip" className="text-slate-700">
              <input
                value={skip}
                onChange={(event) => {
                  const nextSkip = Number(event.target.value);
                  if (Number.isFinite(nextSkip) && nextSkip >= 0) {
                    setSkip(nextSkip);
                  }
                }}
                type="number"
                min={0}
                max={100000}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <button
              onClick={fetchRows}
              className="h-11 rounded-xl bg-slate-900 px-6 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
            >
              {loading ? 'Loading...' : 'Reload'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              {loading ? (
                <LoadingInline label="Fetching ZIP records..." className="text-slate-600" />
              ) : (
                <span>
                  Showing {rows.length} ZIP{rows.length === 1 ? '' : 's'}
                </span>
              )}
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Page {currentPage}
              </span>
            </div>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
              API base: {apiBase}
            </span>
          </div>

          {error ? (
            <div className="mt-4">
              <Alert variant="error" className="text-rose-700">
                {error}
              </Alert>
            </div>
          ) : null}
        </Card>

        <Card variant="plain" className="p-0">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              ZIP Summary
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSkip(Math.max(skip - take, 0))}
                disabled={!hasPrev || loading}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setSkip(skip + take)}
                disabled={!hasNext || loading}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
              offset {skip} · limit {take}
            </span>
          </div>
          <div className="max-h-[540px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">ZIP</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">County</th>
                  <th className="px-6 py-3">Primary City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <TableSkeletonRows columns={4} rows={8} tone="light" />
                ) : (
                  rows.map((row) => (
                    <tr key={row.zip} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {row.zip}
                      </td>
                      <td className="px-6 py-3">{row.state_code}</td>
                      <td className="px-6 py-3">{row.county_name ?? '—'}</td>
                      <td className="px-6 py-3">
                        {row.primary_city_name ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-sm text-slate-500"
                    >
                      No data found for this state.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
