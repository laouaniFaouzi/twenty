import { type Offer } from 'src/constants/offer';
import { TRACKER_TEMPLATES } from 'src/constants/tracker-templates';
import { type ProjectStatus } from 'src/objects/project.object';
import { getEdgeNodes, type RecordApiClient } from 'src/utils/record-api-client';

type ProjectForSeeding = { id: string; offer: Offer | null; status: ProjectStatus };

export type ProjectEvent = {
  name: string;
  recordId: string;
  properties: { updatedFields?: string[] };
};

export const shouldSeedProjectTemplate = ({
  offer,
  status,
  phaseCount,
}: {
  offer: Offer | null;
  status: ProjectStatus;
  phaseCount: number;
}): boolean => offer !== null && status !== 'ARCHIVED' && phaseCount === 0;

export const seedProjectTemplate = async (
  client: RecordApiClient,
  projectId: string,
): Promise<{ seeded: boolean }> => {
  const response = await client.query({
    project: {
      __args: { filter: { id: { eq: projectId } } },
      id: true,
      offer: true,
      status: true,
    },
    projectPhases: {
      __args: { filter: { projectId: { eq: projectId } }, first: 1 },
      edges: { node: { id: true } },
    },
  });

  const project = response.project as ProjectForSeeding | null | undefined;

  if (
    !project ||
    !shouldSeedProjectTemplate({
      offer: project.offer,
      status: project.status,
      phaseCount: getEdgeNodes(response, 'projectPhases').length,
    })
  ) {
    return { seeded: false };
  }

  const phaseTemplates = TRACKER_TEMPLATES[project.offer as Offer];

  for (const [phasePosition, phaseTemplate] of phaseTemplates.entries()) {
    const created = await client.mutation({
      createProjectPhase: {
        __args: {
          data: { name: phaseTemplate.name, position: phasePosition, projectId },
        },
        id: true,
      },
    });

    const phaseId = (created.createProjectPhase as { id: string }).id;

    await client.mutation({
      createProjectTasks: {
        __args: {
          data: phaseTemplate.tasks.map((name, position) => ({
            name,
            position,
            status: 'TODO',
            phaseId,
            projectId,
          })),
        },
        id: true,
      },
    });
  }

  return { seeded: true };
};

export const handleProjectEvent = async (
  client: RecordApiClient,
  event: ProjectEvent,
): Promise<void> => {
  const isCreation = event.name === 'project.created';
  const isOfferChange =
    event.name === 'project.updated' &&
    (event.properties.updatedFields ?? []).includes('offer');

  if (!isCreation && !isOfferChange) {
    return;
  }

  await seedProjectTemplate(client, event.recordId);
};
