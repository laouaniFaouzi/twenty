import { affectedProjectIds } from 'src/utils/affected-project-ids';
import { recomputeProjectProgress } from 'src/utils/recompute-project-progress';
import { type RecordApiClient } from 'src/utils/record-api-client';

type PhaseLinks = { projectId: string | null };

export type ProjectPhaseEvent = {
  name: string;
  recordId: string;
  properties: {
    before?: PhaseLinks;
    after?: PhaseLinks;
    updatedFields?: string[];
  };
};

const PROGRESS_FIELDS = ['name', 'position', 'projectId'];

export const handleProjectPhaseEvent = async (
  client: RecordApiClient,
  { name, recordId, properties }: ProjectPhaseEvent,
): Promise<void> => {
  const operation = name.split('.')[1];

  // The database cascade only fires on destroy; trash and restore are ours.
  if (operation === 'deleted' || operation === 'restored') {
    const mutationName =
      operation === 'deleted' ? 'deleteProjectTasks' : 'restoreProjectTasks';

    await client.mutation({
      [mutationName]: {
        __args: { filter: { phaseId: { eq: recordId } } },
        id: true,
      },
    });
  }

  if (
    operation === 'updated' &&
    !(properties.updatedFields ?? []).some((field) =>
      PROGRESS_FIELDS.includes(field),
    )
  ) {
    return;
  }

  for (const projectId of affectedProjectIds(
    properties.before?.projectId,
    properties.after?.projectId,
  )) {
    await recomputeProjectProgress(client, projectId);
  }
};
