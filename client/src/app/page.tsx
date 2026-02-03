'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const [states, setStates] = useState<string[]>([]);
  const [statesError, setStatesError] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    [],
  );

  const normalizedStateCode = stateCode.trim().toUpperCase();

  useEffect(() => {
    let active = true;

    const loadStates = async () => {
      try {
        const response = await fetch(`${apiBase}/geography/states`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to load states (${response.status}).`);
        }
        const data = (await response.json()) as string[];
        if (active) {
          setStates(Array.isArray(data) ? data : []);
          setStatesError(null);
        }
      } catch (loadError) {
        if (active) {
          setStates([]);
          setStatesError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load states.',
          );
        }
      }
    };

    void loadStates();

    return () => {
      active = false;
    };
  }, [apiBase]);

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

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = (await response.json()) as ZipSummary[];
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

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              State code
              <select
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">Select a state</option>
                {states.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              {statesError ? (
                <span className="text-xs text-rose-500">{statesError}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Page size
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
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Skip
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
            </label>
            <button
              onClick={fetchRows}
              className="h-11 rounded-xl bg-slate-900 px-6 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
            >
              {loading ? 'Loading...' : 'Reload'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing {rows.length} ZIP{rows.length === 1 ? '' : 's'}
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Page {currentPage}
              </span>
            </div>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
              API base: {apiBase}
            </span>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
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
                {rows.map((row) => (
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
                ))}
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
        </section>
      </main>
    </div>
  );
}
