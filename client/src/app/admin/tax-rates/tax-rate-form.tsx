'use client';

import { useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { FormField, FormInput, FormSelect } from '../../../components/FormField';
import { LoadingInline } from '../../../components/LoadingState';
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
  const { states, error: statesError, loading: statesLoading } = useStateCodes();

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f4ff,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-12 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#111827,_#020617_40%,_#020617_70%)] dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-500">
            Admin Console
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Configure tax rates
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Create a new tax rate version. State requires only state code.
            County requires county name. City requires city id or city name
            (state + city name).
          </p>
        </header>

        <Card variant="light">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <fieldset disabled={loading} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Jurisdiction">
                  <FormSelect
                    value={payload.jurisdictionType}
                    onChange={(event) =>
                      updateField(
                        'jurisdictionType',
                        event.target.value as JurisdictionType,
                      )
                    }
                  >
                    <option value="STATE">STATE</option>
                    <option value="COUNTY">COUNTY</option>
                    <option value="CITY">CITY</option>
                  </FormSelect>
                </FormField>
                <FormField
                  label="State code"
                  error={statesError}
                  errorClassName="text-rose-500 dark:text-rose-300"
                >
                  <FormSelect
                    value={payload.stateCode}
                    onChange={(event) =>
                      updateField('stateCode', event.target.value)
                    }
                    disabled={statesLoading}
                  >
                    <option value="">
                      {statesLoading ? 'Loading states...' : 'Select a state'}
                    </option>
                    {states.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField
                  label="Rate"
                  hint={`Min ${MIN_RATE * 100}%, max ${MAX_RATE * 100}%`}
                  hintClassName="text-slate-500 dark:text-slate-400"
                >
                  <FormInput
                    value={payload.rate}
                    onChange={(event) =>
                      updateField('rate', Number(event.target.value))
                    }
                    type="number"
                    step="0.0001"
                    min={MIN_RATE}
                    max={MAX_RATE}
                  />
                </FormField>
              </div>

              {showCounty ? (
                <FormField label="County name">
                  <FormInput
                    value={payload.countyName ?? ''}
                    onChange={(event) =>
                      updateField('countyName', event.target.value)
                    }
                    placeholder="Orange"
                  />
                </FormField>
              ) : null}

              {showCity ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="City ID">
                    <FormInput
                      value={payload.cityId ?? ''}
                      onChange={(event) =>
                        updateField('cityId', Number(event.target.value))
                      }
                      type="number"
                      min="1"
                    />
                  </FormField>
                  <FormField label="City name (optional)">
                    <FormInput
                      value={payload.cityName ?? ''}
                      onChange={(event) =>
                        updateField('cityName', event.target.value)
                      }
                      placeholder="Los Angeles"
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Start time (ISO-8601)">
                  <FormInput
                    value={payload.startTime}
                    onChange={(event) =>
                      updateField('startTime', event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Start date & time (calendar)">
                  <FormInput
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
                  />
                </FormField>
                <FormField label="Admin API key">
                  <FormInput
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    type="password"
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="success"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold"
                >
                  {loading ? 'Saving...' : 'Create rate'}
                </Button>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  API {apiEndpoint} · backend {apiBase}
                </span>
              </div>
          </fieldset>
          </form>

          {loading ? (
            <div className="mt-4">
              <LoadingInline label="Saving tax rate version..." />
            </div>
          ) : null}

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
                      <dl className="mt-2 grid gap-2 text-sm text-emerald-700 dark:text-emerald-100">
                        {fields.map(({ label, value }) => (
                          <div key={label} className="flex justify-between gap-4">
                            <dt className="text-emerald-700/70 dark:text-emerald-200/70">
                              {label}
                            </dt>
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
