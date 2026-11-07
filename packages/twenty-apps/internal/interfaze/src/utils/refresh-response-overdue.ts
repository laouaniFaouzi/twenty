import { REPLY_DELAY_IN_MILLISECONDS } from 'src/utils/handle-lead-created';
import { type RecordApiClient } from 'src/utils/record-api-client';

const updateOpportunities = async (
  client: RecordApiClient,
  filter: Record<string, unknown>,
  responseOverdue: boolean,
): Promise<number> => {
  const response = await client.mutation({
    updateOpportunities: {
      __args: { filter, data: { responseOverdue } },
      id: true,
    },
  });

  return Array.isArray(response.updateOpportunities)
    ? response.updateOpportunities.length
    : 0;
};

export const refreshResponseOverdue = async (
  client: RecordApiClient,
  now: Date,
): Promise<{ flagged: number; cleared: number }> => {
  const threshold = new Date(
    now.getTime() - REPLY_DELAY_IN_MILLISECONDS,
  ).toISOString();

  const flagged = await updateOpportunities(
    client,
    {
      and: [
        { interfazeStage: { eq: 'NEW_REQUEST' } },
        { receivedAt: { lte: threshold } },
        { responseOverdue: { eq: false } },
      ],
    },
    true,
  );

  // A null stage or reception date is no waiting request either: neq alone would skip it.
  const cleared = await updateOpportunities(
    client,
    {
      and: [
        { responseOverdue: { eq: true } },
        {
          or: [
            { interfazeStage: { neq: 'NEW_REQUEST' } },
            { interfazeStage: { is: 'NULL' } },
            { receivedAt: { gt: threshold } },
            { receivedAt: { is: 'NULL' } },
          ],
        },
      ],
    },
    false,
  );

  return { flagged, cleared };
};
