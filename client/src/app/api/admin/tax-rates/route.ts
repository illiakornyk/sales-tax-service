import { getApiBase } from '@/lib/api';

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const body = await request.text();
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/tax-rates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body,
  });

  const responseText = await response.text();

  return new Response(responseText, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
