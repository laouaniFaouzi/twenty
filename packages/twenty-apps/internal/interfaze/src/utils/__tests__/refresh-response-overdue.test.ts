import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { refreshResponseOverdue } from 'src/utils/refresh-response-overdue';

const NOW = new Date('2026-11-07T10:00:00.000Z');

let client: MockRecordApiClient;

beforeEach(() => {
  client = createMockRecordApiClient();
});

describe('refreshResponseOverdue', () => {
  it('flags requests still waiting at Nouvelle demande 48 hours after they arrived', async () => {
    await refreshResponseOverdue(client, NOW);

    expect(mutationArgs(client, 'updateOpportunities')[0]).toEqual({
      filter: {
        and: [
          { interfazeStage: { eq: 'NEW_REQUEST' } },
          { receivedAt: { lte: '2026-11-05T10:00:00.000Z' } },
          { responseOverdue: { eq: false } },
        ],
      },
      data: { responseOverdue: true },
    });
  });

  it('clears the flag of requests answered, moved or without a reception date', async () => {
    await refreshResponseOverdue(client, NOW);

    expect(mutationArgs(client, 'updateOpportunities')[1]).toEqual({
      filter: {
        and: [
          { responseOverdue: { eq: true } },
          {
            or: [
              { interfazeStage: { neq: 'NEW_REQUEST' } },
              { interfazeStage: { is: 'NULL' } },
              { receivedAt: { gt: '2026-11-05T10:00:00.000Z' } },
              { receivedAt: { is: 'NULL' } },
            ],
          },
        ],
      },
      data: { responseOverdue: false },
    });
  });

  it('counts what it changed', async () => {
    client.mutation
      .mockResolvedValueOnce({
        updateOpportunities: [{ id: 'opportunity-1' }, { id: 'opportunity-2' }],
      })
      .mockResolvedValueOnce({
        updateOpportunities: [{ id: 'opportunity-3' }],
      });

    expect(await refreshResponseOverdue(client, NOW)).toEqual({
      flagged: 2,
      cleared: 1,
    });
  });
});
