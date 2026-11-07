import { siteRest } from 'src/utils/supabase-rest';
import { type SyncSettings } from 'src/utils/sync-settings';
import {
  type PhaseFields,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  type TaskFields,
  type TrackerFields,
} from 'src/utils/tracker-mapping';

const RETURN_ROWS = 'return=representation';

const UPSERT_ON_CRM_ID = 'resolution=merge-duplicates,return=representation';

export const insertSiteTracker = async (
  settings: SyncSettings,
  fields: TrackerFields & { token: string; crm_id: string },
  fetchImpl?: typeof fetch,
): Promise<SiteTracker> =>
  (
    await siteRest<SiteTracker>(
      settings,
      { method: 'POST', table: 'trackers', body: fields, prefer: RETURN_ROWS },
      fetchImpl,
    )
  )[0];

export const updateSiteTracker = async (
  settings: SyncSettings,
  id: string,
  patch: Partial<TrackerFields> & { crm_id?: string },
  fetchImpl?: typeof fetch,
): Promise<SiteTracker | null> =>
  (
    await siteRest<SiteTracker>(
      settings,
      {
        method: 'PATCH',
        table: 'trackers',
        query: `id=eq.${encodeURIComponent(id)}`,
        body: patch,
        prefer: RETURN_ROWS,
      },
      fetchImpl,
    )
  )[0] ?? null;

export const fetchSiteRows = <TRow>(
  settings: SyncSettings,
  table: 'trackers' | 'tracker_phases' | 'tracker_tasks' | 'leads',
  filters: Record<string, string>,
  fetchImpl?: typeof fetch,
): Promise<TRow[]> =>
  siteRest<TRow>(
    settings,
    {
      method: 'GET',
      table,
      query: new URLSearchParams({ select: '*', ...filters })
        .toString()
        .replace('select=%2A', 'select=*'),
    },
    fetchImpl,
  );

export const findSiteTrackerByCrmId = async (
  settings: SyncSettings,
  crmId: string,
  fetchImpl?: typeof fetch,
): Promise<SiteTracker | null> =>
  (
    await fetchSiteRows<SiteTracker>(
      settings,
      'trackers',
      { crm_id: `eq.${crmId}` },
      fetchImpl,
    )
  )[0] ?? null;

export const upsertSitePhase = async (
  settings: SyncSettings,
  fields: PhaseFields & { crm_id: string },
  fetchImpl?: typeof fetch,
): Promise<SitePhase> =>
  (
    await siteRest<SitePhase>(
      settings,
      {
        method: 'POST',
        table: 'tracker_phases',
        query: 'on_conflict=crm_id',
        body: fields,
        prefer: UPSERT_ON_CRM_ID,
      },
      fetchImpl,
    )
  )[0];

export const upsertSiteTask = async (
  settings: SyncSettings,
  fields: TaskFields & { crm_id: string },
  fetchImpl?: typeof fetch,
): Promise<SiteTask> =>
  (
    await siteRest<SiteTask>(
      settings,
      {
        method: 'POST',
        table: 'tracker_tasks',
        query: 'on_conflict=crm_id',
        body: fields,
        prefer: UPSERT_ON_CRM_ID,
      },
      fetchImpl,
    )
  )[0];

export const updateSiteRow = async <TRow>(
  settings: SyncSettings,
  table: 'tracker_phases' | 'tracker_tasks',
  id: string,
  patch: Record<string, unknown>,
  fetchImpl?: typeof fetch,
): Promise<TRow | null> =>
  (
    await siteRest<TRow>(
      settings,
      {
        method: 'PATCH',
        table,
        query: `id=eq.${encodeURIComponent(id)}`,
        body: patch,
        prefer: RETURN_ROWS,
      },
      fetchImpl,
    )
  )[0] ?? null;

export const deleteSiteRowByCrmId = async (
  settings: SyncSettings,
  table: 'tracker_phases' | 'tracker_tasks',
  crmId: string,
  fetchImpl?: typeof fetch,
): Promise<void> => {
  await siteRest(
    settings,
    {
      method: 'DELETE',
      table,
      query: `crm_id=eq.${encodeURIComponent(crmId)}`,
      prefer: 'return=minimal',
    },
    fetchImpl,
  );
};
