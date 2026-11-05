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
  it('listens to every page event', () => {
    expect(onPageChanged.success).toBe(true);
    expect(onPageChanged.config.databaseEventTriggerSettings).toEqual({
      eventName: 'page.*',
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
        data: { parentPageId: 'grand-parent', previousParentPageId: 'deleted-page' },
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
      {
        filter: { parentPageId: { eq: 'deleted-page' } },
        data: { parentPageId: null, previousParentPageId: 'deleted-page' },
      },
    ]);
  });

  it('gives a restored page back the sub-pages it lent to its parent', async () => {
    await handlePageEvent(client, {
      name: 'page.restored',
      recordId: 'restored-page',
      properties: { after: { parentPageId: 'grand-parent' } },
    });

    expect(mutationArgs(client, 'updatePages')).toEqual([
      {
        filter: {
          and: [
            { previousParentPageId: { eq: 'restored-page' } },
            { parentPageId: { eq: 'grand-parent' } },
          ],
        },
        data: { parentPageId: 'restored-page', previousParentPageId: null },
      },
    ]);
  });

  it('only takes back sub-pages still at the root when a root page is restored', async () => {
    await handlePageEvent(client, {
      name: 'page.restored',
      recordId: 'restored-page',
      properties: { after: { parentPageId: null } },
    });

    expect(mutationArgs(client, 'updatePages')[0]).toMatchObject({
      filter: {
        and: [
          { previousParentPageId: { eq: 'restored-page' } },
          { parentPageId: { is: 'NULL' } },
        ],
      },
    });
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
