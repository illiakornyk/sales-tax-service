'use client';

import { useEffect, useState } from 'react';
import { fetchJson, getApiBase } from '@/lib/api';
import { geographyStatesUrl } from '@/lib/endpoints';

export function useStateCodes() {
  const [states, setStates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const apiBase = getApiBase();

    const loadStates = async () => {
      setLoading(true);
      try {
        const response = await fetchJson<string[]>(
          geographyStatesUrl(apiBase),
          {
            cache: 'no-store',
          },
        );
        if (!active) return;

        if (response.ok) {
          setStates(Array.isArray(response.data) ? response.data : []);
          setError(null);
        } else {
          setStates([]);
          setError(response.message);
        }
      } catch (loadError) {
        if (!active) return;
        setStates([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load states.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadStates();

    return () => {
      active = false;
    };
  }, []);

  return { states, error, loading };
}
