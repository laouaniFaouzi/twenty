export const waitFor = async <TValue>(
  check: () => Promise<TValue | undefined>,
  { timeoutMs = 60_000, intervalMs = 1_000 } = {},
): Promise<TValue> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await check();

    if (value !== undefined) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs} ms`);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const randomDigits = (length: number) =>
  String(Math.floor(Math.random() * 10 ** length)).padStart(length, '0');

type SiteTable = 'leads' | 'trackers' | 'tracker_phases' | 'tracker_tasks';

// Same calls as the site's own server: the secret key, and no x-sync-origin header
// unless a test simulates a call the trigger never sends.
export const siteRest = async <TRow>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  table: SiteTable,
  query: string,
  body?: Record<string, unknown>,
  { fromHubFaze = false }: { fromHubFaze?: boolean } = {},
): Promise<TRow[]> => {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/${table}${query}`,
    {
      method,
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY ?? '',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(fromHubFaze ? { 'x-sync-origin': 'hubfaze' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Site REST ${method} ${table} failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.status === 204 ? [] : ((await response.json()) as TRow[]);
};
