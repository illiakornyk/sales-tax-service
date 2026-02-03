const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const body = await request.text();

  const response = await fetch(`${API_BASE_URL}/tax-rates`, {
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
