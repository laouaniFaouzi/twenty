import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import onPageChanged from 'src/logic-functions/on-page-changed';
import { handlePageEvent } from 'src/utils/handle-page-event';

let client: MockRecordApiClient;

beforeEach(() => {
  client = createMockRecordApiClient();
});

describe('handlePageEvent', () => {
  it('listens to page deletions', () => {
    expect(onPageChanged.success).toBe(true);
    expect(onPageChanged.config.databaseEventTriggerSettings).toEqual({
      eventName: 'page.deleted',
    });
  });

  it('moves the sub-pages of a deleted page up to its parent', async () => {
    await handlePageEvent(client, {
      name: 'page.deleted',
      recordId: 'deleted-page',
      properties: { before: { parentPageId: 'grand-parent' } },
    });

    expect(mutationArgs(client, 'updatePages')).toEqual([
      {
        filter: { parentPageId: { eq: 'deleted-page' } },
        data: { parentPageId: 'grand-parent' },
      },
    ]);
  });

  it('moves the sub-pages of a deleted root page to the root', async () => {
    await handlePageEvent(client, {
      name: 'page.deleted',
      recordId: 'deleted-page',
      properties: { before: { parentPageId: null } },
    });

    expect(mutationArgs(client, 'updatePages')).toEqual([
      { filter: { parentPageId: { eq: 'deleted-page' } }, data: { parentPageId: null } },
    ]);
  });

  it('ignores other page events', async () => {
    await handlePageEvent(client, {
      name: 'page.updated',
      recordId: 'page',
      properties: { before: { parentPageId: null } },
    });

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });
});
