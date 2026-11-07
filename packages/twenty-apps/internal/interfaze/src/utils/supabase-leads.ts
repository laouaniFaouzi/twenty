import { isSiteRestError, siteRest } from 'src/utils/supabase-rest';
import { type SyncSettings } from 'src/utils/sync-settings';

export type SiteLeadStatus = 'new' | 'in_progress' | 'done';

export type LeadPatch = {
  status?: SiteLeadStatus;
  crm_id?: string | null;
};

export const patchSiteLead = async (
  settings: SyncSettings,
  leadId: string,
  patch: LeadPatch,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  try {
    await siteRest(
      settings,
      {
        method: 'PATCH',
        table: 'leads',
        query: `id=eq.${encodeURIComponent(leadId)}`,
        body: patch,
        prefer: 'return=minimal',
      },
      fetchImpl,
    );
  } catch (error) {
    if (isSiteRestError(error)) {
      throw new Error(
        `Supabase a refusé la mise à jour de la demande ${leadId} (${error.status})`,
      );
    }

    throw error;
  }
};
