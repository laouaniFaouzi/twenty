import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { recordSyncFailure } from 'src/utils/record-sync-failure';

const NOW = new Date('2026-11-07T10:00:00.000Z');

let client: MockRecordApiClient;

beforeEach(() => {
  client = createMockRecordApiClient();
});

describe('recordSyncFailure', () => {
  it('writes one entry of the Journal de synchro', async () => {
    await recordSyncFailure(
      client,
      {
        direction: 'CRM_TO_SITE',
        entity: 'TASK',
        siteId: 'S1',
        recordId: 'R1',
        error: new Error('Supabase a refusé POST tracker_tasks (500)'),
      },
      NOW,
    );

    expect(mutationArgs(client, 'createSyncLog')).toEqual([
      {
        data: {
          name: 'TASK · CRM_TO_SITE',
          occurredAt: '2026-11-07T10:00:00.000Z',
          direction: 'CRM_TO_SITE',
          entity: 'TASK',
          siteId: 'S1',
          recordId: 'R1',
          error: 'Supabase a refusé POST tracker_tasks (500)',
        },
      },
    ]);
  });

  it('keeps the first 2000 characters of a long error, and accepts anything thrown', async () => {
    await recordSyncFailure(
      client,
      {
        direction: 'SITE_TO_CRM',
        entity: 'LEAD',
        siteId: null,
        recordId: null,
        error: 'x'.repeat(5000),
      },
      NOW,
    );
    await recordSyncFailure(
      client,
      {
        direction: 'SITE_TO_CRM',
        entity: 'LEAD',
        siteId: null,
        recordId: null,
        error: { code: 42 },
      },
      NOW,
    );

    const [long, unknown] = mutationArgs(client, 'createSyncLog');

    expect((long.data as { error: string }).error).toHaveLength(2000);
    expect((unknown.data as { error: string }).error).toBe('{"code":42}');
  });

  it('never throws, even when the Journal cannot be written', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    client.mutation.mockRejectedValue(new Error('server down'));

    await expect(
      recordSyncFailure(
        client,
        {
          direction: 'RECONCILIATION',
          entity: 'TRACKER',
          siteId: 'S1',
          recordId: null,
          error: new Error('boom'),
        },
        NOW,
      ),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
