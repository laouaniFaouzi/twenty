import { type SyncSettings } from 'src/utils/sync-settings';

export type SiteLeadStatus = 'new' | 'in_progress' | 'done';

export type LeadPatch = {
  status?: SiteLeadStatus;
  crm_id?: string | null;
};

// Legacy JWT keys must also go in Authorization; sb_secret_ keys are rejected there.
const isJwt = (key: string) => key.split('.').length === 3;

export const patchSiteLead = async (
  settings: SyncSettings,
  leadId: string,
  patch: LeadPatch,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  const response = await fetchImpl(
    `${settings.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: settings.supabaseSecretKey,
        ...(isJwt(settings.supabaseSecretKey)
          ? { Authorization: `Bearer ${settings.supabaseSecretKey}` }
          : {}),
        'x-sync-origin': 'hubfaze',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase a refusé la mise à jour de la demande ${leadId} (${response.status})`,
    );
  }
};
