import {
  type SyncDirection,
  type SyncEntity,
} from 'src/objects/sync-log.object';
import { type RecordApiClient } from 'src/utils/record-api-client';

export type SyncFailure = {
  direction: SyncDirection;
  entity: SyncEntity;
  siteId: string | null;
  recordId: string | null;
  error: unknown;
};

const MAX_ERROR_LENGTH = 2000;

const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
};

// The Journal is the safety net of the sync: failing to write it must not hide the original failure.
export const recordSyncFailure = async (
  client: RecordApiClient,
  { direction, entity, siteId, recordId, error }: SyncFailure,
  now: Date,
): Promise<void> => {
  try {
    await client.mutation({
      createSyncLog: {
        __args: {
          data: {
            name: `${entity} · ${direction}`,
            occurredAt: now.toISOString(),
            direction,
            entity,
            siteId,
            recordId,
            error: describeError(error).slice(0, MAX_ERROR_LENGTH),
          },
        },
        id: true,
      },
    });
  } catch (journalError) {
    console.error('Journal de synchro inaccessible', journalError, error);
  }
};
