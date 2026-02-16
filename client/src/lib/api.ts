const DEFAULT_API_BASE = 'http://localhost:3000';

export const getApiBase = () => {
  if (typeof window === 'undefined') {
    return (
      process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      DEFAULT_API_BASE
    );
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE;
};

type FetchJsonResult<T> =
  | {
      ok: true;
      status: number;
      data: T | null;
      raw: string;
    }
  | {
      ok: false;
      status: number;
      data: unknown | null;
      raw: string;
      message: string;
    };

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  const response = await fetch(input, init);
  const raw = await response.text();

  let data: unknown | null = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = raw;
    }
  }

  if (response.ok) {
    return { ok: true, status: response.status, data: data as T, raw };
  }

  const message =
    data && typeof data === 'object' && 'message' in data
      ? String((data as Record<string, unknown>).message)
      : raw || `Request failed with status ${response.status}`;

  return { ok: false, status: response.status, data, raw, message };
}
