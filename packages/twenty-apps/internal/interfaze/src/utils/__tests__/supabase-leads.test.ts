import { describe, expect, it, vi } from 'vitest';

import { patchSiteLead } from 'src/utils/supabase-leads';
import { type SyncSettings } from 'src/utils/sync-settings';

const settingsWithKey = (supabaseSecretKey: string): SyncSettings => ({
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey,
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
});

const respondingWith = (status: number) =>
  vi.fn<typeof fetch>(async () => new Response(null, { status }));

describe('patchSiteLead', () => {
  it('patches the lead through the REST API, marked as coming from HubFaze', async () => {
    const fetchImpl = respondingWith(204);

    await patchSiteLead(
      settingsWithKey('sb_secret_xyz'),
      'L1',
      { status: 'done' },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://abc.supabase.co/rest/v1/leads?id=eq.L1',
      {
        method: 'PATCH',
        headers: {
          apikey: 'sb_secret_xyz',
          'x-sync-origin': 'hubfaze',
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: '{"status":"done"}',
      },
    );
  });

  it('also sends a bearer token when the key is a JWT', async () => {
    const fetchImpl = respondingWith(204);

    await patchSiteLead(
      settingsWithKey('aaa.bbb.ccc'),
      'L1',
      { crm_id: 'O1' },
      fetchImpl,
    );

    const [, init] = fetchImpl.mock.calls[0];

    expect(init?.headers).toMatchObject({
      apikey: 'aaa.bbb.ccc',
      Authorization: 'Bearer aaa.bbb.ccc',
    });
    expect(init?.body).toBe('{"crm_id":"O1"}');
  });

  it('never sends a bearer token for a secret key', async () => {
    const fetchImpl = respondingWith(204);

    await patchSiteLead(
      settingsWithKey('sb_secret_xyz'),
      'L1',
      { status: 'new' },
      fetchImpl,
    );

    const [, init] = fetchImpl.mock.calls[0];

    expect(init?.headers).not.toHaveProperty('Authorization');
  });

  it('fails when Supabase refuses the update', async () => {
    await expect(
      patchSiteLead(
        settingsWithKey('sb_secret_xyz'),
        'L1',
        { status: 'done' },
        respondingWith(401),
      ),
    ).rejects.toThrow(
      'Supabase a refusé la mise à jour de la demande L1 (401)',
    );
  });
});
