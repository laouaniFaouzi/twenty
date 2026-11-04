import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { recomputeProjectProgress } from 'src/utils/recompute-project-progress';

const PROJECT_ID = 'project-a';

let client: MockRecordApiClient;

const givenProject = (current: { progress: number | null; currentPhase: string | null }) => {
  client.query.mockResolvedValueOnce({
    project: { id: PROJECT_ID, ...current },
    projectPhases: connection([
      { id: 'phase-2', name: 'Vous validez le design', position: 1 },
      { id: 'phase-1', name: 'On échange', position: 0 },
    ]),
    projectTasks: connection([
      { phaseId: 'phase-1', status: 'DONE' },
      { phaseId: 'phase-1', status: 'DONE' },
      { phaseId: 'phase-2', status: 'TODO' },
      { phaseId: 'phase-2', status: 'TODO' },
    ]),
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
});

describe('recomputeProjectProgress', () => {
  it('reads the phases and tasks of the project', async () => {
    givenProject({ progress: 0, currentPhase: 'On échange' });

    await recomputeProjectProgress(client, PROJECT_ID);

    const request = client.query.mock.calls[0][0];

    expect(request.projectPhases.__args).toEqual({
      filter: { projectId: { eq: PROJECT_ID } },
      first: 200,
    });
    expect(request.projectTasks.__args).toEqual({
      filter: { projectId: { eq: PROJECT_ID } },
      first: 200,
    });
  });

  it('writes the new progress and current phase', async () => {
    givenProject({ progress: 0, currentPhase: 'On échange' });

    await recomputeProjectProgress(client, PROJECT_ID);

    expect(mutationArgs(client, 'updateProject')).toEqual([
      { id: PROJECT_ID, data: { progress: 50, currentPhase: 'Vous validez le design' } },
    ]);
  });

  it('ignores the tasks of a phase that was deleted', async () => {
    client.query.mockResolvedValueOnce({
      project: { id: PROJECT_ID, progress: 0, currentPhase: 'On échange' },
      projectPhases: connection([{ id: 'phase-1', name: 'On échange', position: 0 }]),
      projectTasks: connection([
        { phaseId: 'phase-1', status: 'DONE' },
        { phaseId: 'deleted-phase', status: 'TODO' },
      ]),
    });

    await recomputeProjectProgress(client, PROJECT_ID);

    expect(mutationArgs(client, 'updateProject')).toEqual([
      { id: PROJECT_ID, data: { progress: 100, currentPhase: 'Terminé' } },
    ]);
  });

  it('does not write when nothing changed', async () => {
    givenProject({ progress: 50, currentPhase: 'Vous validez le design' });

    await recomputeProjectProgress(client, PROJECT_ID);

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('does nothing when the project no longer exists', async () => {
    client.query.mockResolvedValueOnce({
      project: null,
      projectPhases: connection([]),
      projectTasks: connection([]),
    });

    await recomputeProjectProgress(client, PROJECT_ID);

    expect(client.mutation).not.toHaveBeenCalled();
  });
});
