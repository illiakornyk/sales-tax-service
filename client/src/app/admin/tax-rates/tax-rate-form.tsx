'use client';

import { useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Card } from '../../../components/Card';
import { FormField } from '../../../components/FormField';
import { useStateCodes } from '../../../hooks/use-state-codes';
import { fetchJson, getApiBase } from '../../../lib/api';

type JurisdictionType = 'STATE' | 'COUNTY' | 'CITY';

type CreateTaxRatePayload = {
  jurisdictionType: JurisdictionType;
  stateCode: string;
  countyName?: string;
  cityId?: number;
  cityName?: string;
  rate: number;
  startTime: string;
};

type ApiError = {
  status: number;
  message: string;
};

type ApiSuccess = {
  status: number;
  data: Record<string, unknown> | string | null;
};

const MAX_RATE = 0.2;
const MIN_RATE = 0.001;
const MIN_YEAR = 1970;

const DEFAULT_PAYLOAD: CreateTaxRatePayload = {
  jurisdictionType: 'STATE',
  stateCode: 'CA',
  rate: 0.0625,
  startTime: new Date().toISOString(),
};

export function TaxRateForm() {
  const [payload, setPayload] = useState<CreateTaxRatePayload>(DEFAULT_PAYLOAD);
  const [apiKey, setApiKey] = useState('');
  const [success, setSuccess] = useState<ApiSuccess | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const { states, error: statesError } = useStateCodes();

  const apiEndpoint = '/api/admin/tax-rates';
  const apiBase = getApiBase();

  const showCounty = payload.jurisdictionType === 'COUNTY';
  const showCity = payload.jurisdictionType === 'CITY';

  const updateField = <K extends keyof CreateTaxRatePayload>(
    key: K,
    value: CreateTaxRatePayload[K],
  ) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetchJson<Record<string, unknown>>(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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

      if (!response.ok) {
        setError({ status: response.status, message: response.message });
        return;
      }

      setSuccess({ status: response.status, data: response.data ?? null });
    } catch (submitError) {
      setError({
        status: 0,
        message:
          submitError instanceof Error
            ? submitError.message
            : 'Failed to create tax rate.',
      });
    } finally {
      setLoading(false);
    }
  };

  const pad = (value: number) => String(value).padStart(2, '0');
  const parsedStartTime = (() => {
    if (!payload.startTime) return null;
    const parsed = new Date(payload.startTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();
  const localDateValue = parsedStartTime
    ? `${parsedStartTime.getFullYear()}-${pad(
        parsedStartTime.getMonth() + 1,
      )}-${pad(parsedStartTime.getDate())}`
    : '';
  const localTimeValue = parsedStartTime
    ? `${pad(parsedStartTime.getHours())}:${pad(parsedStartTime.getMinutes())}`
    : '';
  const localDateTimeValue =
    localDateValue && localTimeValue
      ? `${localDateValue}T${localTimeValue}`
      : '';

  const updateFromDateTimeParts = (nextDate: string, nextTime: string) => {
    if (!nextDate) return;
    const [year, month, day] = nextDate.split('-').map(Number);
    const [hours, minutes] = (nextTime || '00:00').split(':').map(Number);
    if (
      [year, month, day, hours, minutes].some((value) => Number.isNaN(value))
    ) {
      return;
    }
    if (year < MIN_YEAR) {
      return;
    }
    const local = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (!Number.isNaN(local.getTime())) {
      updateField('startTime', local.toISOString());
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
            Create a new tax rate version. State requires only state code.
            County requires county name. City requires city id or city name
            (state + city name).
          </p>
        </header>

        <Card variant="dark">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Jurisdiction">
                <select
                  value={payload.jurisdictionType}
                  onChange={(event) =>
                    updateField(
                      'jurisdictionType',
                      event.target.value as JurisdictionType,
                    )
                  }
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                >
                  <option value="STATE">STATE</option>
                  <option value="COUNTY">COUNTY</option>
                  <option value="CITY">CITY</option>
                </select>
              </FormField>
              <FormField
                label="State code"
                error={statesError}
                errorClassName="text-rose-300"
              >
                <select
                  value={payload.stateCode}
                  onChange={(event) =>
                    updateField('stateCode', event.target.value)
                  }
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                >
                  <option value="">Select a state</option>
                  {states.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Rate"
                hint={`Min ${MIN_RATE * 100}%, max ${MAX_RATE * 100}%`}
                hintClassName="text-slate-400"
              >
                <input
                  value={payload.rate}
                  onChange={(event) =>
                    updateField('rate', Number(event.target.value))
                  }
                  type="number"
                  step="0.0001"
                  min={MIN_RATE}
                  max={MAX_RATE}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </FormField>
            </div>

            {showCounty ? (
              <FormField label="County name">
                <input
                  value={payload.countyName ?? ''}
                  onChange={(event) =>
                    updateField('countyName', event.target.value)
                  }
                  placeholder="Orange"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </FormField>
            ) : null}

            {showCity ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="City ID">
                  <input
                    value={payload.cityId ?? ''}
                    onChange={(event) =>
                      updateField('cityId', Number(event.target.value))
                    }
                    type="number"
                    min="1"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                  />
                </FormField>
                <FormField label="City name (optional)">
                  <input
                    value={payload.cityName ?? ''}
                    onChange={(event) =>
                      updateField('cityName', event.target.value)
                    }
                    placeholder="Los Angeles"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                  />
                </FormField>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Start time (ISO-8601)">
                <input
                  value={payload.startTime}
                  onChange={(event) =>
                    updateField('startTime', event.target.value)
                  }
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </FormField>
              <FormField label="Start date & time (calendar)">
                <input
                  value={localDateTimeValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) return;
                    const [nextDate, nextTime = '00:00'] = value.split('T');
                    updateFromDateTimeParts(nextDate, nextTime);
                  }}
                  type="datetime-local"
                  min={`${MIN_YEAR}-01-01T00:00`}
                  step="60"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </FormField>
              <FormField label="Admin API key">
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  type="password"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-400 px-6 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Create rate'}
              </button>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                API {apiEndpoint} · backend {apiBase}
              </span>
            </div>
          </form>

          {error ? (
            <div className="mt-4">
              <Alert
                variant="error"
                title={`Error ${error.status || ''}`.trim()}
              >
                <div className="text-sm font-medium">{error.message}</div>
              </Alert>
            </div>
          ) : null}
          {success ? (
            <div className="mt-4">
              <Alert variant="success" title={`Success ${success.status}`}>
                {success.data && typeof success.data === 'object' ? (
                  (() => {
                    const successData = success.data as Record<string, unknown>;
                    const fields: Array<{ label: string; value: unknown }> = [
                      { label: 'ID', value: successData.id },
                      { label: 'Jurisdiction', value: successData.jurisdiction_type },
                      { label: 'State', value: successData.state_code },
                      { label: 'County', value: successData.county_name },
                      { label: 'City ID', value: successData.city_id },
                      { label: 'Rate', value: successData.rate },
                      { label: 'Start Time', value: successData.start_time },
                    ];

                    return (
                      <dl className="mt-2 grid gap-2 text-sm text-emerald-100">
                        {fields.map(({ label, value }) => (
                          <div key={label} className="flex justify-between gap-4">
                            <dt className="text-emerald-200/70">{label}</dt>
                            <dd className="text-right font-medium">
                              {value === null || value === undefined
                                ? '—'
                                : String(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    );
                  })()
                ) : (
                  <p className="text-sm">
                    {success.data ? String(success.data) : 'Saved.'}
                  </p>
                )}
              </Alert>
            </div>
          ) : null}
        </Card>
      </main>
    </div>
  );
}
