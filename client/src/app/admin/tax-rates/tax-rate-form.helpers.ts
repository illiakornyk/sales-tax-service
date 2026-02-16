import type { ResponseDetailsField } from '@/components/ResponseDetails';

export type JurisdictionType = 'STATE' | 'COUNTY' | 'CITY';

export type CreateTaxRatePayload = {
  jurisdictionType: JurisdictionType;
  stateCode: string;
  countyName?: string;
  cityId?: number;
  cityName?: string;
  rate: number;
  startTime: string;
};

type SuccessFieldKey =
  | 'id'
  | 'jurisdiction_type'
  | 'state_code'
  | 'county_name'
  | 'city_id'
  | 'rate'
  | 'start_time';

const SUCCESS_FIELD_DEFINITIONS: Array<{
  label: string;
  key: SuccessFieldKey;
}> = [
  { label: 'ID', key: 'id' },
  { label: 'Jurisdiction', key: 'jurisdiction_type' },
  { label: 'State', key: 'state_code' },
  { label: 'County', key: 'county_name' },
  { label: 'City ID', key: 'city_id' },
  { label: 'Rate', key: 'rate' },
  { label: 'Start Time', key: 'start_time' },
];

export function buildCreateTaxRateRequestBody(payload: CreateTaxRatePayload) {
  const isCounty = payload.jurisdictionType === 'COUNTY';
  const isCity = payload.jurisdictionType === 'CITY';

  return {
    jurisdictionType: payload.jurisdictionType,
    stateCode: payload.stateCode.trim().toUpperCase(),
    countyName: isCounty ? payload.countyName?.trim() : undefined,
    cityId: isCity ? payload.cityId : undefined,
    cityName: isCity ? payload.cityName?.trim() : undefined,
    rate: Number(payload.rate),
    startTime: payload.startTime,
  };
}

export function parseSuccessData(
  data: Record<string, unknown> | string | null,
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data;
}

export function buildSuccessFields(
  data: Record<string, unknown>,
): ResponseDetailsField[] {
  return SUCCESS_FIELD_DEFINITIONS.map(({ label, key }) => ({
    label,
    value: data[key],
  }));
}

export function getSubmitErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to create tax rate.';
}
