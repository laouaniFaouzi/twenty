import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
} from 'src/__tests__/utils/create-mock-record-api-client';
import onProjectPhaseChanged from 'src/logic-functions/on-project-phase-changed';
import { handleProjectPhaseEvent } from 'src/utils/handle-project-phase-event';

const recomputed = vi.hoisted(() => [] as string[]);

vi.mock('src/utils/recompute-project-progress', () => ({
  recomputeProjectProgress: async (_client: unknown, projectId: string) => {
    recomputed.push(projectId);
  },
}));

let client: MockRecordApiClient;

beforeEach(() => {
  recomputed.length = 0;
  client = createMockRecordApiClient();
});

describe('handleProjectPhaseEvent', () => {
  it('listens to every phase event', () => {
    expect(onProjectPhaseChanged.success).toBe(true);
    expect(onProjectPhaseChanged.config.databaseEventTriggerSettings).toEqual({
      eventName: 'projectPhase.*',
    });
  });

  it.each([
    ['projectPhase.created', { after: { projectId: 'project-a' } }],
    ['projectPhase.deleted', { before: { projectId: 'project-a' } }],
    ['projectPhase.destroyed', { before: { projectId: 'project-a' } }],
    ['projectPhase.restored', { after: { projectId: 'project-a' } }],
  ])('recomputes the project on %s', async (name, properties) => {
    await handleProjectPhaseEvent(client, { name, recordId: 'phase-1', properties });

    expect(recomputed).toEqual(['project-a']);
  });

  it.each([['name'], ['position']])(
    'recomputes the project when the %s of a phase changes',
    async (field) => {
      await handleProjectPhaseEvent(client, {
        name: 'projectPhase.updated',
        recordId: 'phase-1',
        properties: {
          before: { projectId: 'project-a' },
          after: { projectId: 'project-a' },
          updatedFields: [field],
        },
      });

      expect(recomputed).toEqual(['project-a']);
    },
  );

  it('recomputes both projects when a phase moves to another project', async () => {
    await handleProjectPhaseEvent(client, {
      name: 'projectPhase.updated',
      recordId: 'phase-1',
      properties: {
        before: { projectId: 'project-a' },
        after: { projectId: 'project-b' },
        updatedFields: ['projectId'],
      },
    });

    expect(recomputed).toEqual(['project-a', 'project-b']);
  });

  it('moves the tasks of a deleted phase to the trash with it', async () => {
    await handleProjectPhaseEvent(client, {
      name: 'projectPhase.deleted',
      recordId: 'phase-1',
      properties: { before: { projectId: 'project-a' } },
    });

    expect(mutationNames(client)).toEqual(['deleteProjectTasks']);
    expect(mutationArgs(client, 'deleteProjectTasks')).toEqual([
      { filter: { phaseId: { eq: 'phase-1' } } },
    ]);
  });

  it('restores the tasks of a restored phase', async () => {
    await handleProjectPhaseEvent(client, {
      name: 'projectPhase.restored',
      recordId: 'phase-1',
      properties: { after: { projectId: 'project-a' } },
    });

    expect(mutationArgs(client, 'restoreProjectTasks')).toEqual([
      { filter: { phaseId: { eq: 'phase-1' } } },
    ]);
  });

  it('ignores other updates and phases without project', async () => {
    await handleProjectPhaseEvent(client, {
      name: 'projectPhase.updated',
      recordId: 'phase-1',
      properties: {
        before: { projectId: 'project-a' },
        after: { projectId: 'project-a' },
        updatedFields: ['updatedAt'],
      },
    });
    await handleProjectPhaseEvent(client, {
      name: 'projectPhase.created',
      recordId: 'phase-1',
      properties: { after: { projectId: null } },
    });

    expect(recomputed).toEqual([]);
  });
});
