import { beforeEach, describe, expect, it } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
  queryFilters,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  createRenewalTasks,
  isRenewalTaskDue,
} from 'src/utils/create-renewal-tasks';

const NOW = new Date('2026-11-07T05:00:00Z');

type ContractAnswer = {
  id: string;
  name: string | null;
  renewalDate: string | null;
  renewalTaskCreatedFor: string | null;
  company: { id: string; name: string } | null;
  project: { ownerId: string | null } | null;
};

const CONTRACT: ContractAnswer = {
  id: 'contract-1',
  name: 'Hébergement Boulangerie',
  renewalDate: '2026-12-01',
  renewalTaskCreatedFor: null,
  company: { id: 'company-1', name: 'Boulangerie Dupont' },
  project: { ownerId: 'owner-1' },
};

let client: MockRecordApiClient;

const given = (contracts: ContractAnswer[], members: { id: string }[] = []) => {
  answerQueries(client, {
    maintenanceContracts: () => contracts,
    taskTargets: () => [],
    workspaceMembers: () => members,
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(async (request) =>
    'createTask' in request ? { createTask: { id: 'task-new' } } : {},
  );
});

describe('isRenewalTaskDue', () => {
  it.each([
    ['renews in 10 days', '2026-11-17', null, true],
    ['renews in exactly 30 days', '2026-12-07', null, true],
    ['renews in 31 days', '2026-12-08', null, false],
    ['renewal date already passed', '2026-11-04', null, true],
    ['task already created for this date', '2026-11-17', '2026-11-17', false],
    ['task created for the previous renewal', '2026-11-17', '2025-11-17', true],
    ['no renewal date', null, null, false],
  ])('%s', (_, renewalDate, renewalTaskCreatedFor, expected) => {
    expect(
      isRenewalTaskDue({ renewalDate, renewalTaskCreatedFor }, '2026-11-07'),
    ).toBe(expected);
  });
});

describe('createRenewalTasks', () => {
  it('reads only active contracts renewing within 30 days', async () => {
    given([]);

    await createRenewalTasks(client, { now: NOW, leadOwnerEmail: null });

    expect(queryFilters(client, 'maintenanceContracts')[0]).toEqual({
      status: { eq: 'ACTIVE' },
      renewalDate: { lte: '2026-12-07' },
    });
  });

  it('creates the task for the project owner, due on the renewal date, then remembers it', async () => {
    given([CONTRACT]);

    const result = await createRenewalTasks(client, {
      now: NOW,
      leadOwnerEmail: 'lucas@interfaze.fr',
    });

    expect(result).toEqual({ created: 1, failures: 0 });
    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title: 'Renouveler le contrat Hébergement Boulangerie',
          status: 'TODO',
          assigneeId: 'owner-1',
          dueAt: '2026-12-01T08:00:00.000Z',
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      {
        data: { taskId: 'task-new', targetMaintenanceContractId: 'contract-1' },
      },
      { data: { taskId: 'task-new', targetCompanyId: 'company-1' } },
    ]);
    expect(mutationNames(client).slice(-1)).toEqual([
      'updateMaintenanceContract',
    ]);
    expect(mutationArgs(client, 'updateMaintenanceContract')).toEqual([
      { id: 'contract-1', data: { renewalTaskCreatedFor: '2026-12-01' } },
    ]);
    expect(
      client.query.mock.calls.map(([request]) => Object.keys(request)[0]),
    ).not.toContain('workspaceMembers');
  });

  it('moves a task left open from the previous renewal to the new date', async () => {
    answerQueries(client, {
      maintenanceContracts: () => [
        { ...CONTRACT, renewalTaskCreatedFor: '2025-12-01' },
      ],
      taskTargets: () => [
        {
          id: 'target-old',
          task: {
            id: 'task-old',
            title: 'Renouveler le contrat Hébergement Boulangerie',
            status: 'TODO',
          },
        },
      ],
      workspaceMembers: () => [],
    });

    const result = await createRenewalTasks(client, {
      now: NOW,
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ created: 0, failures: 0 });
    expect(mutationNames(client)).toEqual([
      'updateTask',
      'updateMaintenanceContract',
    ]);
    expect(mutationArgs(client, 'updateTask')).toEqual([
      { id: 'task-old', data: { dueAt: '2026-12-01T08:00:00.000Z' } },
    ]);
    expect(mutationArgs(client, 'updateMaintenanceContract')).toEqual([
      { id: 'contract-1', data: { renewalTaskCreatedFor: '2026-12-01' } },
    ]);
  });

  it('skips a contract whose task already exists for this renewal date', async () => {
    given([{ ...CONTRACT, renewalTaskCreatedFor: '2026-12-01' }]);

    const result = await createRenewalTasks(client, {
      now: NOW,
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ created: 0, failures: 0 });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('falls back to the lead owner, then to nobody', async () => {
    given([{ ...CONTRACT, project: null }], [{ id: 'member-9' }]);

    await createRenewalTasks(client, {
      now: NOW,
      leadOwnerEmail: 'lucas@interfaze.fr',
    });
    await createRenewalTasks(client, { now: NOW, leadOwnerEmail: null });

    expect(
      mutationArgs(client, 'createTask').map(
        (args) => (args.data as { assigneeId: string | null }).assigneeId,
      ),
    ).toEqual(['member-9', null]);
  });

  it('names the task after the company when the contract has no name, and says so when there is neither', async () => {
    given([
      { ...CONTRACT, name: '' },
      { ...CONTRACT, id: 'contract-2', name: null, company: null },
    ]);

    await createRenewalTasks(client, { now: NOW, leadOwnerEmail: null });

    expect(
      mutationArgs(client, 'createTask').map(
        (args) => (args.data as { title: string }).title,
      ),
    ).toEqual([
      'Renouveler le contrat Boulangerie Dupont',
      'Renouveler le contrat sans nom',
    ]);
  });

  it('keeps going when one contract fails', async () => {
    given([CONTRACT, { ...CONTRACT, id: 'contract-2' }]);
    let createTaskCalls = 0;
    client.mutation.mockImplementation(async (request) => {
      if ('createTask' in request) {
        createTaskCalls += 1;

        if (createTaskCalls === 1) {
          throw new Error('API down');
        }

        return { createTask: { id: 'task-new' } };
      }

      return {};
    });

    const result = await createRenewalTasks(client, {
      now: NOW,
      leadOwnerEmail: null,
    });

    expect(result).toEqual({ created: 1, failures: 1 });
    expect(mutationArgs(client, 'updateMaintenanceContract')).toEqual([
      { id: 'contract-2', data: { renewalTaskCreatedFor: '2026-12-01' } },
    ]);
  });
});
