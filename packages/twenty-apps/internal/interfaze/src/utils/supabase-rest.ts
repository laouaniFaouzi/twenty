import { type SyncSettings } from 'src/utils/sync-settings';

export type SiteRestError = Error & { status: number };

export type SiteRestRequest = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  table: string;
  query?: string;
  body?: unknown;
  prefer?: string;
};

// Legacy JWT keys must also go in Authorization; sb_secret_ keys are rejected there.
const isJwt = (key: string) => key.split('.').length === 3;

export const isSiteRestError = (error: unknown): error is SiteRestError =>
  error instanceof Error && typeof (error as SiteRestError).status === 'number';

// Every write carries x-sync-origin so the site's trigger never sends it back to HubFaze.
export const siteRest = async <TRow>(
  settings: SyncSettings,
  { method, table, query, body, prefer }: SiteRestRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<TRow[]> => {
  const response = await fetchImpl(
    `${settings.supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ''}`,
    {
      method,
      headers: {
        apikey: settings.supabaseSecretKey,
        ...(isJwt(settings.supabaseSecretKey)
          ? { Authorization: `Bearer ${settings.supabaseSecretKey}` }
          : {}),
        'x-sync-origin': 'hubfaze',
        'Content-Type': 'application/json',
        ...(prefer === undefined ? {} : { Prefer: prefer }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw Object.assign(
      new Error(`Supabase a refusé ${method} ${table} (${response.status})`),
      { status: response.status },
    );
  }

  const text = response.status === 204 ? '' : await response.text();

  return text === '' ? [] : (JSON.parse(text) as TRow[]);
};
