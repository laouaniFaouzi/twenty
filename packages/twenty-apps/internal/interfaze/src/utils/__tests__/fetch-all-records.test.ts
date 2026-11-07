import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { fetchAllRecords } from 'src/utils/fetch-all-records';

let client: MockRecordApiClient;

beforeEach(() => {
  client = createMockRecordApiClient();
});

describe('fetchAllRecords', () => {
  it('reads every page of a filtered root', async () => {
    client.query
      .mockResolvedValueOnce({
        projects: {
          ...connection([{ id: 'P1' }]),
          pageInfo: { hasNextPage: true, endCursor: 'c1' },
        },
      })
      .mockResolvedValueOnce({
        projects: {
          ...connection([{ id: 'P2' }]),
          pageInfo: { hasNextPage: false, endCursor: 'c2' },
        },
      });

    expect(
      await fetchAllRecords<{ id: string }>(client, 'projects', {
        filter: { status: { neq: 'ARCHIVED' } },
        node: { id: true },
      }),
    ).toEqual([{ id: 'P1' }, { id: 'P2' }]);
    expect(
      client.query.mock.calls.map(([request]) => request.projects.__args),
    ).toEqual([
      { filter: { status: { neq: 'ARCHIVED' } }, first: 200 },
      { filter: { status: { neq: 'ARCHIVED' } }, first: 200, after: 'c1' },
    ]);
  });
});
