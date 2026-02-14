type GeographyStateZipListParams = {
  stateCode: string;
  skip: number;
  take: number;
};

type TaxRatesByZipParams = {
  zip: string;
  atIso: string;
};

type CurrentTaxRatesParams = {
  stateSkip: number;
  stateTake: number;
  countySkip: number;
  countyTake: number;
  citySkip: number;
  cityTake: number;
};

export function geographyStatesUrl(apiBase: string): URL {
  return new URL('/geography/states', apiBase);
}

export function geographyStateZipListUrl(
  apiBase: string,
  params: GeographyStateZipListParams,
): URL {
  const url = new URL(`/geography/state/${params.stateCode}`, apiBase);
  url.searchParams.set('skip', String(params.skip));
  url.searchParams.set('take', String(params.take));
  return url;
}

export function taxRatesByZipUrl(
  apiBase: string,
  params: TaxRatesByZipParams,
): URL {
  const url = new URL(`/tax-rates/zip/${params.zip}`, apiBase);
  url.searchParams.set('at', params.atIso);
  return url;
}

export function currentTaxRatesUrl(
  apiBase: string,
  params: CurrentTaxRatesParams,
): URL {
  const url = new URL('/tax-rates/current', apiBase);
  url.searchParams.set('stateSkip', String(params.stateSkip));
  url.searchParams.set('stateTake', String(params.stateTake));
  url.searchParams.set('countySkip', String(params.countySkip));
  url.searchParams.set('countyTake', String(params.countyTake));
  url.searchParams.set('citySkip', String(params.citySkip));
  url.searchParams.set('cityTake', String(params.cityTake));
  return url;
}
