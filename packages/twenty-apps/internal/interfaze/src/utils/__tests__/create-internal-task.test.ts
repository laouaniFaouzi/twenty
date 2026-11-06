import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { createInternalTask } from 'src/utils/create-internal-task';

const INPUT = {
  title: "Choisir l'offre de Refonte du site",
  assigneeId: 'member-1',
  dueAt: null,
  target: { objectName: 'opportunity' as const, recordId: 'opportunity-1' },
};

let client: MockRecordApiClient;

const givenLinkedTasks = (tasks: { title: string; status: string }[]) => {
  client.query.mockResolvedValueOnce({
    taskTargets: connection(
      tasks.map((task, index) => ({
        id: `target-${index}`,
        task: { id: `task-${index}`, ...task },
      })),
    ),
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(async (request) =>
    'createTask' in request ? { createTask: { id: 'task-new' } } : {},
  );
});

describe('createInternalTask', () => {
  it('creates the task, then links it to its record', async () => {
    givenLinkedTasks([]);

    expect(await createInternalTask(client, INPUT)).toEqual({ created: true });
    expect(client.query.mock.calls[0][0].taskTargets.__args.filter).toEqual({
      targetOpportunityId: { eq: 'opportunity-1' },
    });
    expect(mutationNames(client)).toEqual(['createTask', 'createTaskTarget']);
    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title: "Choisir l'offre de Refonte du site",
          status: 'TODO',
          assigneeId: 'member-1',
          dueAt: null,
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'task-new', targetOpportunityId: 'opportunity-1' } },
    ]);
  });

  it('does not duplicate an unfinished task with the same title on the same record', async () => {
    givenLinkedTasks([
      { title: "Choisir l'offre de Refonte du site", status: 'IN_PROGRESS' },
    ]);

    expect(await createInternalTask(client, INPUT)).toEqual({ created: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('creates the task again when the previous one is done', async () => {
    givenLinkedTasks([
      { title: "Choisir l'offre de Refonte du site", status: 'DONE' },
    ]);

    expect(await createInternalTask(client, INPUT)).toEqual({ created: true });
  });

  it('links to a company or a person with the matching target field', async () => {
    givenLinkedTasks([]);

    await createInternalTask(client, {
      ...INPUT,
      target: { objectName: 'company', recordId: 'company-1' },
    });

    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'task-new', targetCompanyId: 'company-1' } },
    ]);
  });

  it('links the task to extra records after its first target, still checking duplicates on the first one only', async () => {
    givenLinkedTasks([]);

    await createInternalTask(client, {
      ...INPUT,
      extraTargets: [{ objectName: 'person', recordId: 'person-1' }],
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'task-new', targetOpportunityId: 'opportunity-1' } },
      { data: { taskId: 'task-new', targetPersonId: 'person-1' } },
    ]);
  });
});
