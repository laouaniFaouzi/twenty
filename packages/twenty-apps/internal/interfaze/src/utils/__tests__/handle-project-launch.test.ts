import { beforeEach, describe, expect, it } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { handleProjectLaunch } from 'src/utils/handle-project-launch';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

const LAUNCH_EVENT = {
  name: 'project.updated',
  recordId: PROJECT_ID,
  properties: { updatedFields: ['launchedAt'] },
};

type ProjectAnswer = {
  name: string;
  status: string;
  launchedAt: string | null;
  ownerId: string | null;
  company: { id: string; name: string } | null;
};

const LAUNCHED_PROJECT: ProjectAnswer = {
  name: 'Boulangerie Dupont · WebFaze',
  status: 'IN_PROGRESS',
  launchedAt: '2026-11-07',
  ownerId: 'owner-1',
  company: { id: 'company-1', name: 'Boulangerie Dupont' },
};

let client: MockRecordApiClient;

const given = ({
  project = LAUNCHED_PROJECT,
  activeContracts = [],
  linkedTasks = [],
  members = [],
}: {
  project?: ProjectAnswer;
  activeContracts?: { id: string }[];
  linkedTasks?: { title: string; status: string }[];
  members?: { id: string }[];
}) => {
  answerQueries(client, {
    projects: () => [{ id: PROJECT_ID, ...project }],
    maintenanceContracts: () => activeContracts,
    taskTargets: () =>
      linkedTasks.map((task, index) => ({
        id: `target-${index}`,
        task: { id: `task-${index}`, ...task },
      })),
    workspaceMembers: () => members,
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(async (request) =>
    'createTask' in request ? { createTask: { id: 'task-new' } } : {},
  );
});

describe('handleProjectLaunch', () => {
  it('marks an in-progress project as launched and asks its owner to propose a maintenance contract', async () => {
    given({});

    const result = await handleProjectLaunch(client, LAUNCH_EVENT, {
      leadOwnerEmail: 'lucas@interfaze.fr',
    });

    expect(result).toEqual({ launched: true, taskCreated: true });
    expect(mutationArgs(client, 'updateProject')).toEqual([
      { id: PROJECT_ID, data: { status: 'LAUNCHED' } },
    ]);
    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title: 'Proposer un contrat de maintenance à Boulangerie Dupont',
          status: 'TODO',
          assigneeId: 'owner-1',
          dueAt: null,
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'task-new', targetProjectId: PROJECT_ID } },
      { data: { taskId: 'task-new', targetCompanyId: 'company-1' } },
    ]);
  });

  it('ignores updates that do not touch the launch date', async () => {
    given({});

    await handleProjectLaunch(
      client,
      { ...LAUNCH_EVENT, properties: { updatedFields: ['name'] } },
      { leadOwnerEmail: null },
    );

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('does nothing when the launch date is cleared', async () => {
    given({ project: { ...LAUNCHED_PROJECT, launchedAt: null } });

    const result = await handleProjectLaunch(client, LAUNCH_EVENT, {
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ launched: false, taskCreated: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it.each(['LAUNCHED', 'ARCHIVED'])(
    'leaves a %s project as it is, and still proposes the contract',
    async (status) => {
      given({ project: { ...LAUNCHED_PROJECT, status } });

      const result = await handleProjectLaunch(client, LAUNCH_EVENT, {
        leadOwnerEmail: null,
      });

      expect(result).toEqual({ launched: false, taskCreated: true });
      expect(mutationNames(client)).not.toContain('updateProject');
      expect(mutationNames(client)).toContain('createTask');
    },
  );

  it('skips the proposal when the project already has an active contract', async () => {
    given({ activeContracts: [{ id: 'contract-1' }] });

    const result = await handleProjectLaunch(client, LAUNCH_EVENT, {
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ launched: true, taskCreated: false });
    expect(mutationNames(client)).toEqual(['updateProject']);
  });

  it('never proposes twice, even once the first task is done', async () => {
    given({
      project: { ...LAUNCHED_PROJECT, status: 'LAUNCHED' },
      linkedTasks: [
        {
          title: 'Proposer un contrat de maintenance à Boulangerie Dupont',
          status: 'DONE',
        },
      ],
    });

    const result = await handleProjectLaunch(client, LAUNCH_EVENT, {
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ launched: false, taskCreated: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('falls back to the lead owner and to the project name', async () => {
    given({
      project: { ...LAUNCHED_PROJECT, ownerId: null, company: null },
      members: [{ id: 'member-9' }],
    });

    await handleProjectLaunch(client, LAUNCH_EVENT, {
      leadOwnerEmail: 'lucas@interfaze.fr',
    });

    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title:
            'Proposer un contrat de maintenance à Boulangerie Dupont · WebFaze',
          status: 'TODO',
          assigneeId: 'member-9',
          dueAt: null,
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'task-new', targetProjectId: PROJECT_ID } },
    ]);
  });

  it('handles a project created already launched', async () => {
    given({});

    const result = await handleProjectLaunch(
      client,
      { name: 'project.created', recordId: PROJECT_ID, properties: {} },
      { leadOwnerEmail: null },
    );

    expect(result).toEqual({ launched: true, taskCreated: true });
  });

  it('ignores a deleted project', async () => {
    given({});

    await handleProjectLaunch(
      client,
      { name: 'project.deleted', recordId: PROJECT_ID, properties: {} },
      { leadOwnerEmail: null },
    );

    expect(client.query).not.toHaveBeenCalled();
  });
});
