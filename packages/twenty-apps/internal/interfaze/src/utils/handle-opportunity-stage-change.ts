import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { REPLY_TASK_TITLE_PREFIX } from 'src/utils/handle-lead-created';
import { statusForStage } from 'src/utils/lead-mapping';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';
import { type patchSiteLead } from 'src/utils/supabase-leads';
import { type SyncSettings } from 'src/utils/sync-settings';

export type OpportunityStageChangeEvent = {
  recordId: string;
  properties: {
    before: { interfazeStage?: InterfazeStage | null };
    after: {
      interfazeStage?: InterfazeStage | null;
      siteLeadId?: string | null;
      siteLeadStatusSeen?: string | null;
    };
  };
};

type LinkedTask = {
  task: { id: string; title: string | null; status: string | null } | null;
};

const closeReplyTasks = async (
  client: RecordApiClient,
  opportunityId: string,
) => {
  const response = await client.query({
    taskTargets: {
      __args: {
        filter: { targetOpportunityId: { eq: opportunityId } },
        first: 100,
      },
      edges: {
        node: { id: true, task: { id: true, title: true, status: true } },
      },
    },
  });

  for (const { task } of getEdgeNodes<LinkedTask>(response, 'taskTargets')) {
    if (
      task !== null &&
      task.status !== 'DONE' &&
      (task.title ?? '').startsWith(REPLY_TASK_TITLE_PREFIX)
    ) {
      await client.mutation({
        updateTask: {
          __args: { id: task.id, data: { status: 'DONE' } },
          id: true,
        },
      });
    }
  }
};

export const handleOpportunityStageChange = async (
  client: RecordApiClient,
  { recordId, properties: { before, after } }: OpportunityStageChangeEvent,
  {
    settings,
    patchLead,
  }: { settings: SyncSettings | null; patchLead: typeof patchSiteLead },
): Promise<void> => {
  const previousStage = before.interfazeStage ?? null;
  const stage = after.interfazeStage ?? null;

  if (stage === null || stage === previousStage) {
    return;
  }

  if (previousStage === 'NEW_REQUEST') {
    await closeReplyTasks(client, recordId);
  }

  const siteLeadId = after.siteLeadId ?? null;
  const status = statusForStage(stage);

  // A status already seen came from the site itself: sending it back would loop.
  if (
    settings === null ||
    siteLeadId === null ||
    status === after.siteLeadStatusSeen
  ) {
    return;
  }

  await patchLead(settings, siteLeadId, { status });
  await client.mutation({
    updateOpportunity: {
      __args: { id: recordId, data: { siteLeadStatusSeen: status } },
      id: true,
    },
  });
};
