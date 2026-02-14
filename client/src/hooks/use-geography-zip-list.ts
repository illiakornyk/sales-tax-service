'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchJson, getApiBase } from '../lib/api';
import { geographyStateZipListUrl } from '../lib/endpoints';

export type ZipSummary = {
  zip: string;
  state_code: string;
  county_name: string | null;
  primary_city_name: string | null;
};

type GeographyFilters = {
  stateCode: string;
  skip: number;
  take: number;
};

const DEFAULT_FILTERS: GeographyFilters = {
  stateCode: 'CA',
  skip: 0,
  take: 50,
};

export function useGeographyZipList() {
  const [draftFilters, setDraftFilters] =
    useState<GeographyFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<GeographyFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<ZipSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = getApiBase();
  const normalizedDraftStateCode = draftFilters.stateCode.trim().toUpperCase();
  const normalizedAppliedStateCode = appliedFilters.stateCode.trim().toUpperCase();

  const hasPendingFilterChanges =
    normalizedDraftStateCode !== normalizedAppliedStateCode ||
    draftFilters.skip !== appliedFilters.skip ||
    draftFilters.take !== appliedFilters.take;

  const fetchRows = useCallback(async () => {
    if (!normalizedAppliedStateCode) {
      setError('State code is required.');
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = geographyStateZipListUrl(apiBase, {
        stateCode: normalizedAppliedStateCode,
        skip: appliedFilters.skip,
        take: appliedFilters.take,
      });

      const response = await fetchJson<ZipSummary[]>(url, { cache: 'no-store' });
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
  }, [apiBase, normalizedAppliedStateCode, appliedFilters.skip, appliedFilters.take]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const currentPage = Math.floor(appliedFilters.skip / appliedFilters.take) + 1;
  const hasPrev = appliedFilters.skip > 0;
  const hasNext = rows.length === appliedFilters.take;

  const setDraftStateCode = (stateCode: string) => {
    setDraftFilters((previous) => ({ ...previous, stateCode }));
  };

  const setDraftTake = (take: number) => {
    if (!Number.isFinite(take) || take <= 0) {
      return;
    }
    setDraftFilters((previous) => ({ ...previous, take, skip: 0 }));
  };

  const setDraftSkip = (skip: number) => {
    if (!Number.isFinite(skip) || skip < 0) {
      return;
    }
    setDraftFilters((previous) => ({ ...previous, skip }));
  };

  const applyDraftFilters = () => {
    setAppliedFilters({
      stateCode: normalizedDraftStateCode,
      skip: draftFilters.skip,
      take: draftFilters.take,
    });
  };

  const goToPrevPage = () => {
    const nextSkip = Math.max(appliedFilters.skip - appliedFilters.take, 0);
    setDraftFilters((previous) => ({ ...previous, skip: nextSkip }));
    setAppliedFilters((previous) => ({ ...previous, skip: nextSkip }));
  };

  const goToNextPage = () => {
    const nextSkip = appliedFilters.skip + appliedFilters.take;
    setDraftFilters((previous) => ({ ...previous, skip: nextSkip }));
    setAppliedFilters((previous) => ({ ...previous, skip: nextSkip }));
  };

  return {
    apiBase,
    appliedFilters,
    applyDraftFilters,
    currentPage,
    draftFilters,
    error,
    goToNextPage,
    goToPrevPage,
    hasNext,
    hasPendingFilterChanges,
    hasPrev,
    loading,
    rows,
    setDraftSkip,
    setDraftStateCode,
    setDraftTake,
  };
}
