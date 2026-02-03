"use client";

import { useMemo, useState } from "react";

type JurisdictionType = "STATE" | "COUNTY" | "CITY";

type CreateTaxRatePayload = {
  jurisdictionType: JurisdictionType;
  stateCode: string;
  countyName?: string;
  cityId?: number;
  cityName?: string;
  rate: number;
  startTime: string;
};

const DEFAULT_PAYLOAD: CreateTaxRatePayload = {
  jurisdictionType: "STATE",
  stateCode: "CA",
  rate: 0.0625,
  startTime: new Date().toISOString(),
};

export function TaxRateForm() {
  const [payload, setPayload] =
    useState<CreateTaxRatePayload>(DEFAULT_PAYLOAD);
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiEndpoint = "/api/admin/tax-rates";
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
    [],
  );

  const showCounty = payload.jurisdictionType === "COUNTY";
  const showCity = payload.jurisdictionType === "CITY";

  const updateField = <K extends keyof CreateTaxRatePayload>(
    key: K,
    value: CreateTaxRatePayload[K],
  ) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          jurisdictionType: payload.jurisdictionType,
          stateCode: payload.stateCode.trim().toUpperCase(),
          countyName: showCounty ? payload.countyName?.trim() : undefined,
          cityId: showCity ? payload.cityId : undefined,
          cityName: showCity ? payload.cityName?.trim() : undefined,
          rate: Number(payload.rate),
          startTime: payload.startTime,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status}): ${text || "unknown error"}`,
        );
      }
      setResponse(text);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create tax rate.",
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
            Admin Console
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Configure tax rates
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Create a new tax rate version. State requires only state code. County
            requires county name. City requires city id or city name (state +
            city name).
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)]">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Jurisdiction
                <select
                  value={payload.jurisdictionType}
                  onChange={(event) =>
                    updateField(
                      "jurisdictionType",
                      event.target.value as JurisdictionType,
                    )
                  }
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                >
                  <option value="STATE">STATE</option>
                  <option value="COUNTY">COUNTY</option>
                  <option value="CITY">CITY</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                State code
                <input
                  value={payload.stateCode}
                  onChange={(event) =>
                    updateField("stateCode", event.target.value)
                  }
                  placeholder="CA"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Rate
                <input
                  value={payload.rate}
                  onChange={(event) =>
                    updateField("rate", Number(event.target.value))
                  }
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
            </div>

            {showCounty ? (
              <label className="flex flex-col gap-2 text-sm font-medium">
                County name
                <input
                  value={payload.countyName ?? ""}
                  onChange={(event) =>
                    updateField("countyName", event.target.value)
                  }
                  placeholder="Orange"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
            ) : null}

            {showCity ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  City ID
                  <input
                    value={payload.cityId ?? ""}
                    onChange={(event) =>
                      updateField("cityId", Number(event.target.value))
                    }
                    type="number"
                    min="1"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  City name (optional)
                  <input
                    value={payload.cityName ?? ""}
                    onChange={(event) =>
                      updateField("cityName", event.target.value)
                    }
                    placeholder="Los Angeles"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                  />
                </label>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Start time (ISO-8601)
                <input
                  value={payload.startTime}
                  onChange={(event) =>
                    updateField("startTime", event.target.value)
                  }
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Admin API key
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  type="password"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-400 px-6 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create rate"}
              </button>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                API {apiEndpoint} · backend {apiBase}
              </span>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {response ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <pre className="whitespace-pre-wrap text-xs">{response}</pre>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
