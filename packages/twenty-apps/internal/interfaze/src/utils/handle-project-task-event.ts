import { affectedProjectIds } from 'src/utils/affected-project-ids';
import { recomputeProjectProgress } from 'src/utils/recompute-project-progress';
import { type RecordApiClient } from 'src/utils/record-api-client';

type TaskLinks = { phaseId: string | null; projectId: string | null };

export type ProjectTaskEvent = {
  name: string;
  properties: {
    before?: TaskLinks;
    after?: TaskLinks & { id: string };
    updatedFields?: string[];
  };
};

const PROGRESS_FIELDS = ['status', 'phaseId', 'projectId'];

const LINK_FIELDS = ['phaseId', 'projectId'];

export const handleProjectTaskEvent = async (
  client: RecordApiClient,
  { name, properties }: ProjectTaskEvent,
): Promise<void> => {
  const operation = name.split('.')[1];
  const updatedFields = properties.updatedFields ?? [];

  if (
    operation === 'updated' &&
    !updatedFields.some((field) => PROGRESS_FIELDS.includes(field))
  ) {
    return;
  }

  const after = properties.after;
  const linksMayHaveChanged =
    operation === 'created' ||
    operation === 'restored' ||
    (operation === 'updated' &&
      updatedFields.some((field) => LINK_FIELDS.includes(field)));

  if (after?.phaseId && linksMayHaveChanged) {
    const response = await client.query({
      projectPhase: {
        __args: { filter: { id: { eq: after.phaseId } } },
        id: true,
        projectId: true,
      },
    });

    const phaseProjectId = (
      response.projectPhase as { projectId: string | null } | null | undefined
    )?.projectId;

    // The follow-up update event of this write recomputes the projects.
    if (phaseProjectId && phaseProjectId !== after.projectId) {
      await client.mutation({
        updateProjectTask: {
          __args: { id: after.id, data: { projectId: phaseProjectId } },
          id: true,
        },
      });

      return;
    }
  }

  for (const projectId of affectedProjectIds(
    properties.before?.projectId,
    after?.projectId,
  )) {
    await recomputeProjectProgress(client, projectId);
  }
};
