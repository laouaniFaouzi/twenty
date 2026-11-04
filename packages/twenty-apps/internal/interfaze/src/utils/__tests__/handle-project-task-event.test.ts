import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import onProjectTaskChanged from 'src/logic-functions/on-project-task-changed';
import { handleProjectTaskEvent } from 'src/utils/handle-project-task-event';

const recomputed = vi.hoisted(() => [] as string[]);

vi.mock('src/utils/recompute-project-progress', () => ({
  recomputeProjectProgress: async (_client: unknown, projectId: string) => {
    recomputed.push(projectId);
  },
}));

let client: MockRecordApiClient;

const givenPhaseOf = (projectId: string | null) => {
  client.query.mockResolvedValueOnce({
    projectPhase: { id: 'phase-1', projectId },
  });
};

beforeEach(() => {
  recomputed.length = 0;
  client = createMockRecordApiClient();
});

describe('handleProjectTaskEvent', () => {
  it('listens to every tracker task event', () => {
    expect(onProjectTaskChanged.success).toBe(true);
    expect(onProjectTaskChanged.config.databaseEventTriggerSettings).toEqual({
      eventName: 'projectTask.*',
    });
  });

  it('fills the project of a new task from its phase, then waits for the follow-up update', async () => {
    givenPhaseOf('project-b');

    await handleProjectTaskEvent(client, {
      name: 'projectTask.created',
      properties: { after: { id: 'task-1', phaseId: 'phase-1', projectId: null } },
    });

    expect(client.query.mock.calls[0][0].projectPhase.__args).toEqual({
      filter: { id: { eq: 'phase-1' } },
    });
    expect(mutationArgs(client, 'updateProjectTask')).toEqual([
      { id: 'task-1', data: { projectId: 'project-b' } },
    ]);
    expect(recomputed).toEqual([]);
  });

  it('recomputes the project when a task status changes', async () => {
    await handleProjectTaskEvent(client, {
      name: 'projectTask.updated',
      properties: {
        before: { phaseId: 'phase-1', projectId: 'project-a' },
        after: { id: 'task-1', phaseId: 'phase-1', projectId: 'project-a' },
        updatedFields: ['status'],
      },
    });

    expect(recomputed).toEqual(['project-a']);
  });

  it('ignores changes to internal fields', async () => {
    await handleProjectTaskEvent(client, {
      name: 'projectTask.updated',
      properties: {
        before: { phaseId: 'phase-1', projectId: 'project-a' },
        after: { id: 'task-1', phaseId: 'phase-1', projectId: 'project-a' },
        updatedFields: ['assigneeId', 'dueDate'],
      },
    });

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
    expect(recomputed).toEqual([]);
  });

  it('moves a task to the project of its new phase', async () => {
    givenPhaseOf('project-b');

    await handleProjectTaskEvent(client, {
      name: 'projectTask.updated',
      properties: {
        before: { phaseId: 'phase-0', projectId: 'project-a' },
        after: { id: 'task-1', phaseId: 'phase-1', projectId: 'project-a' },
        updatedFields: ['phaseId'],
      },
    });

    expect(mutationArgs(client, 'updateProjectTask')).toEqual([
      { id: 'task-1', data: { projectId: 'project-b' } },
    ]);
    expect(recomputed).toEqual([]);
  });

  it('recomputes both projects once the task has moved', async () => {
    givenPhaseOf('project-b');

    await handleProjectTaskEvent(client, {
      name: 'projectTask.updated',
      properties: {
        before: { phaseId: 'phase-1', projectId: 'project-a' },
        after: { id: 'task-1', phaseId: 'phase-1', projectId: 'project-b' },
        updatedFields: ['projectId'],
      },
    });

    expect(client.mutation).not.toHaveBeenCalled();
    expect(recomputed).toEqual(['project-a', 'project-b']);
  });

  it.each(['projectTask.deleted', 'projectTask.destroyed'])(
    'recomputes the former project on %s',
    async (name) => {
      await handleProjectTaskEvent(client, {
        name,
        properties: { before: { phaseId: 'phase-1', projectId: 'project-a' } },
      });

      expect(recomputed).toEqual(['project-a']);
    },
  );

  it('recomputes the project of a restored task', async () => {
    givenPhaseOf('project-a');

    await handleProjectTaskEvent(client, {
      name: 'projectTask.restored',
      properties: { after: { id: 'task-1', phaseId: 'phase-1', projectId: 'project-a' } },
    });

    expect(recomputed).toEqual(['project-a']);
  });
});
