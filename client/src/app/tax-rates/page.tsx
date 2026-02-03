"use client";

import { useMemo, useState } from "react";

type RateRow = {
  id: string;
  jurisdiction_type: string;
  state_code: string;
  county_name: string | null;
  city_id: string | null;
  rate: string;
  start_time: string;
};

type ZipRateResult = {
  state: RateRow;
  county: RateRow;
  city: RateRow[];
  total_rate: string;
  breakdown: {
    state_rate: string;
    county_rate: string;
    max_city_rate: string;
    max_city?: { city_id: string; city_name: string } | null;
  };
};

const ZIP_REGEX = /^\d{5}$/;

export default function TaxRatesLookupPage() {
  const [zip, setZip] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [atIso, setAtIso] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ZipRateResult | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
    [],
  );

  const parsedAt = new Date(atIso);
  const atIsValid = !Number.isNaN(parsedAt.getTime());

  const pad = (value: number) => String(value).padStart(2, "0");
  const localDateTimeValue = atIsValid
    ? `${parsedAt.getFullYear()}-${pad(parsedAt.getMonth() + 1)}-${pad(
        parsedAt.getDate(),
      )}T${pad(parsedAt.getHours())}:${pad(parsedAt.getMinutes())}`
    : "";

  const formatRate = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return `${(numeric * 100).toFixed(2)}%`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!ZIP_REGEX.test(zip)) {
      setError("ZIP code must be 5 digits.");
      return;
    }
    if (!atIsValid) {
      setError("Please provide a valid timestamp.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Client API key is required.");
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`/tax-rates/zip/${zip}`, apiBase);
      url.searchParams.set("at", parsedAt.toISOString());

      const response = await fetch(url, {
        headers: {
          "x-api-key": apiKey,
          accept: "application/json",
        },
        cache: "no-store",
      });

      const text = await response.text();
      let parsed: ZipRateResult | null = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as ZipRateResult;
        } catch {
          throw new Error(text);
        }
      }

      if (!response.ok) {
        const message =
          parsed && typeof parsed === "object" && "message" in parsed
            ? String((parsed as Record<string, unknown>).message)
            : text || "Request failed.";
        throw new Error(`Error ${response.status}: ${message}`);
      }

      setResult(parsed);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Request failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Client Query
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Calculate tax rate by ZIP
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Enter a ZIP code and a timestamp to retrieve the effective tax
            breakdown.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)]">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                ZIP code
                <input
                  value={zip}
                  onChange={(event) => setZip(event.target.value.trim())}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="05079"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Timestamp (ISO-8601)
                <input
                  value={atIso}
                  onChange={(event) => setAtIso(event.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Timestamp (picker)
                <input
                  value={localDateTimeValue}
                  onChange={(event) => {
                    const next = new Date(event.target.value);
                    if (!Number.isNaN(next.getTime())) {
                      setAtIso(next.toISOString());
                    }
                  }}
                  type="datetime-local"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr] md:items-end">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Client API key
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  type="password"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-xl bg-indigo-400 px-6 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Calculate"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        {result ? (
          <section className="grid gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total Rate
              </p>
              <div className="mt-2 text-4xl font-semibold">
                {formatRate(result.total_rate)}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
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
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>City</span>
                    <span>
                      {result.breakdown.max_city.city_name} (
                      {result.breakdown.max_city.city_id})
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Rate details
              </h2>
              <div className="mt-4 grid gap-4 text-sm text-slate-300">
                {[result.state, result.county].map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        {row.jurisdiction_type}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatRate(row.rate)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {row.state_code}
                      {row.county_name ? ` · ${row.county_name}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Start {row.start_time}
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    CITY
                  </div>
                  <div className="mt-3 grid gap-2">
                    {result.city.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-300">
                          City ID {row.city_id ?? "—"}
                        </span>
                        <span className="font-semibold">
                          {formatRate(row.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
