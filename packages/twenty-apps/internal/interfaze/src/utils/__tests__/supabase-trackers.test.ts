import { describe, expect, it, vi } from 'vitest';

import { siteRest } from 'src/utils/supabase-rest';
import {
  deleteSiteRowByCrmId,
  fetchSiteRows,
  findSiteTrackerByCrmId,
  insertSiteTracker,
  updateSiteRow,
  updateSiteTracker,
  upsertSitePhase,
  upsertSiteTask,
} from 'src/utils/supabase-trackers';
import { type SyncSettings } from 'src/utils/sync-settings';

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
};

const HEADERS = {
  apikey: 'sb_secret_xyz',
  'x-sync-origin': 'hubfaze',
  'Content-Type': 'application/json',
};

const respondingWith = (status: number, rows?: unknown[]) =>
  vi.fn<typeof fetch>(
    async () =>
      new Response(rows === undefined ? null : JSON.stringify(rows), {
        status,
      }),
  );

const ROW = { id: 'S1', updated_at: '2026-11-07T10:00:00.000Z' };

describe('siteRest', () => {
  it('fails with the status when Supabase refuses', async () => {
    await expect(
      siteRest(
        SETTINGS,
        { method: 'POST', table: 'trackers', body: {} },
        respondingWith(409),
      ),
    ).rejects.toMatchObject({
      message: 'Supabase a refusé POST trackers (409)',
      status: 409,
    });
  });

  it('reads an empty answer as no rows', async () => {
    expect(
      await siteRest(
        SETTINGS,
        { method: 'DELETE', table: 'tracker_tasks' },
        respondingWith(204),
      ),
    ).toEqual([]);
  });
});

describe('tracker client', () => {
  it('inserts a tracker and returns its row', async () => {
    const fetchImpl = respondingWith(201, [ROW]);
    const fields = {
      client_name: 'Boulangerie Martin',
      offer: 'web',
      is_active: true,
      token: 'code',
      crm_id: 'P1',
    };

    expect(await insertSiteTracker(SETTINGS, fields, fetchImpl)).toEqual(ROW);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://abc.supabase.co/rest/v1/trackers',
      {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: JSON.stringify(fields),
      },
    );
  });

  it('updates a tracker by its site id, and tells when no row was there', async () => {
    const fetchImpl = respondingWith(200, [ROW]);

    expect(
      await updateSiteTracker(SETTINGS, 'S1', { is_active: false }, fetchImpl),
    ).toEqual(ROW);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://abc.supabase.co/rest/v1/trackers?id=eq.S1',
      {
        method: 'PATCH',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: '{"is_active":false}',
      },
    );
    expect(
      await updateSiteTracker(
        SETTINGS,
        'S1',
        { is_active: false },
        respondingWith(200, []),
      ),
    ).toBeNull();
  });

  it('finds a tracker by its HubFaze id', async () => {
    const fetchImpl = respondingWith(200, [ROW]);

    expect(await findSiteTrackerByCrmId(SETTINGS, 'P1', fetchImpl)).toEqual(
      ROW,
    );
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://abc.supabase.co/rest/v1/trackers?select=*&crm_id=eq.P1&order=id.asc&limit=1000&offset=0',
    );
    expect(
      await findSiteTrackerByCrmId(SETTINGS, 'P1', respondingWith(200, [])),
    ).toBeNull();
  });

  const expectUpsertCall = (
    fetchImpl: ReturnType<typeof respondingWith>,
    table: string,
    fields: Record<string, unknown>,
  ) =>
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://abc.supabase.co/rest/v1/${table}?on_conflict=crm_id`,
      {
        method: 'POST',
        headers: {
          ...HEADERS,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(fields),
      },
    );

  it('upserts a phase on its HubFaze id', async () => {
    const fetchImpl = respondingWith(201, [ROW]);
    const fields = {
      tracker_id: 'T1',
      name: 'On échange',
      position: 0,
      crm_id: 'PH1',
    };

    expect(await upsertSitePhase(SETTINGS, fields, fetchImpl)).toEqual(ROW);
    expectUpsertCall(fetchImpl, 'tracker_phases', fields);
  });

  it('upserts a task on its HubFaze id', async () => {
    const fetchImpl = respondingWith(201, [ROW]);
    const fields = {
      phase_id: 'S-PH1',
      name: 'Atelier',
      description: '',
      status: 'todo',
      position: 1.5,
      crm_id: 'TA1',
    };

    expect(await upsertSiteTask(SETTINGS, fields, fetchImpl)).toEqual(ROW);
    expectUpsertCall(fetchImpl, 'tracker_tasks', fields);
  });

  it('updates a phase or a task by its site id, and tells when no row was there', async () => {
    const fetchImpl = respondingWith(200, [ROW]);

    expect(
      await updateSiteRow(
        SETTINGS,
        'tracker_tasks',
        'S-TA1',
        { status: 'done' },
        fetchImpl,
      ),
    ).toEqual(ROW);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://abc.supabase.co/rest/v1/tracker_tasks?id=eq.S-TA1',
      {
        method: 'PATCH',
        headers: { ...HEADERS, Prefer: 'return=representation' },
        body: '{"status":"done"}',
      },
    );
    expect(
      await updateSiteRow(
        SETTINGS,
        'tracker_phases',
        'S-PH1',
        { name: 'x' },
        respondingWith(200, []),
      ),
    ).toBeNull();
  });

  it('deletes a phase or a task by its HubFaze id', async () => {
    const fetchImpl = respondingWith(204);

    await deleteSiteRowByCrmId(SETTINGS, 'tracker_tasks', 'TA1', fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://abc.supabase.co/rest/v1/tracker_tasks?crm_id=eq.TA1',
      {
        method: 'DELETE',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: undefined,
      },
    );
  });

  it('reads every page, since Supabase returns at most 1000 rows per request', async () => {
    const page = (size: number, from: number) =>
      Array.from({ length: size }, (_, index) => ({ id: `S${from + index}` }));
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page(1000, 0)), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page(5, 1000)), { status: 200 }),
      );

    expect(
      await fetchSiteRows(SETTINGS, 'tracker_tasks', {}, fetchImpl),
    ).toHaveLength(1005);
    expect(
      fetchImpl.mock.calls.map(([url]) => String(url).split('&').slice(-1)[0]),
    ).toEqual(['offset=0', 'offset=1000']);
  });

  it('reads rows with PostgREST filters', async () => {
    const fetchImpl = respondingWith(200, [ROW]);

    expect(
      await fetchSiteRows(
        SETTINGS,
        'tracker_phases',
        {
          tracker_id: 'in.(T1,T2)',
          updated_at: 'gte.2026-10-08T10:00:00.000Z',
        },
        fetchImpl,
      ),
    ).toEqual([ROW]);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://abc.supabase.co/rest/v1/tracker_phases?select=*&tracker_id=in.%28T1%2CT2%29&updated_at=gte.2026-10-08T10%3A00%3A00.000Z&order=id.asc&limit=1000&offset=0',
    );
  });
});
