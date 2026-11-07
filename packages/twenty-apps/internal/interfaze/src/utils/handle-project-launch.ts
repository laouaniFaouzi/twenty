import { type ProjectStatus } from 'src/objects/project.object';
import { createInternalTask } from 'src/utils/create-internal-task';
import { findMemberIdByEmail } from 'src/utils/handle-lead-created';
import { presentText } from 'src/utils/present-text';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';
import { type ProjectEvent } from 'src/utils/seed-project-template';

type LaunchedProject = {
  id: string;
  name: string | null;
  status: ProjectStatus;
  launchedAt: string | null;
  ownerId: string | null;
  company: { id: string; name: string | null } | null;
};

export const maintenanceProposalTitle = (clientName: string): string =>
  `Proposer un contrat de maintenance à ${clientName}`;

const isLaunchEvent = ({ name, properties }: ProjectEvent): boolean =>
  name === 'project.created' ||
  (name === 'project.updated' &&
    (properties.updatedFields ?? []).includes('launchedAt'));

export const handleProjectLaunch = async (
  client: RecordApiClient,
  event: ProjectEvent,
  { leadOwnerEmail }: { leadOwnerEmail: string | null },
): Promise<{ launched: boolean; taskCreated: boolean }> => {
  const nothing = { launched: false, taskCreated: false };

  if (!isLaunchEvent(event)) {
    return nothing;
  }

  const response = await client.query({
    projects: {
      __args: { filter: { id: { eq: event.recordId } }, first: 1 },
      edges: {
        node: {
          id: true,
          name: true,
          status: true,
          launchedAt: true,
          ownerId: true,
          company: { id: true, name: true },
        },
      },
    },
    maintenanceContracts: {
      __args: {
        filter: {
          projectId: { eq: event.recordId },
          status: { eq: 'ACTIVE' },
        },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  });

  const project = getEdgeNodes<LaunchedProject>(response, 'projects')[0];

  if (!project || presentText(project.launchedAt) === null) {
    return nothing;
  }

  const launched = project.status === 'IN_PROGRESS';

  if (launched) {
    await client.mutation({
      updateProject: {
        __args: { id: project.id, data: { status: 'LAUNCHED' } },
        id: true,
      },
    });
  }

  if (getEdgeNodes(response, 'maintenanceContracts').length > 0) {
    return { launched, taskCreated: false };
  }

  const clientName =
    presentText(project.company?.name) ??
    presentText(project.name) ??
    'sans nom';

  const { created } = await createInternalTask(client, {
    title: maintenanceProposalTitle(clientName),
    assigneeId:
      project.ownerId ?? (await findMemberIdByEmail(client, leadOwnerEmail)),
    dueAt: null,
    target: { objectName: 'project', recordId: project.id },
    extraTargets: project.company
      ? [{ objectName: 'company', recordId: project.company.id }]
      : [],
    duplicateCheck: 'any',
  });

  return { launched, taskCreated: created };
};
