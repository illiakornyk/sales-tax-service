'use client';

import { useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { FormField, FormInput, FormSelect } from '../../../components/FormField';
import { LoadingInline } from '../../../components/LoadingState';
import { PageShell } from '../../../components/PageShell';
import { ResponseDetails } from '../../../components/ResponseDetails';
import { StateCodeSelectField } from '../../../components/StateCodeSelectField';
import { useStateCodes } from '../../../hooks/use-state-codes';
import { fetchJson, getApiBase } from '../../../lib/api';
import { dateTimePartsToIso, isoToDateTimeLocal } from '../../../lib/datetime';
import {
  buildCreateTaxRateRequestBody,
  buildSuccessFields,
  getSubmitErrorMessage,
  parseSuccessData,
  type CreateTaxRatePayload,
  type JurisdictionType,
} from './tax-rate-form.helpers';

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
      const requestBody = buildCreateTaxRateRequestBody(payload);
      const response = await fetchJson<Record<string, unknown>>(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        setError({ status: response.status, message: response.message });
        return;
      }

      setSuccess({ status: response.status, data: response.data ?? null });
    } catch (submitError) {
      setError({
        status: 0,
        message: getSubmitErrorMessage(submitError),
      });
    } finally {
      setLoading(false);
    }
  };

  const localDateTimeValue = isoToDateTimeLocal(payload.startTime);

  const updateFromDateTimeParts = (nextDate: string, nextTime: string) => {
    const isoValue = dateTimePartsToIso(nextDate, nextTime, {
      minYear: MIN_YEAR,
    });
    if (isoValue) {
      updateField('startTime', isoValue);
    }
  };

  const successData = parseSuccessData(success?.data ?? null);
  const successFields = successData ? buildSuccessFields(successData) : [];

  return (
    <PageShell mainClassName="max-w-4xl">
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
                <StateCodeSelectField
                  value={payload.stateCode}
                  states={states}
                  loading={statesLoading}
                  error={statesError}
                  onChange={(value) => updateField('stateCode', value)}
                  errorClassName="text-rose-500 dark:text-rose-300"
                />
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
                {successData ? (
                  <ResponseDetails fields={successFields} />
                ) : (
                  <p className="text-sm">
                    {success.data ? String(success.data) : 'Saved.'}
                  </p>
                )}
              </Alert>
            </div>
          ) : null}
        </Card>
    </PageShell>
  );
}
