import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  seedProjectTemplate,
  shouldSeedProjectTemplate,
} from 'src/utils/seed-project-template';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

let client: MockRecordApiClient;

const givenProject = (
  project: { offer: string | null; status: string },
  phaseIds: string[] = [],
) => {
  client.query.mockResolvedValueOnce({
    project: { id: PROJECT_ID, ...project },
    projectPhases: connection(phaseIds.map((id) => ({ id }))),
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
  let phaseNumber = 0;
  client.mutation.mockImplementation(async (request) => {
    if ('createProjectPhase' in request) {
      phaseNumber += 1;

      return { createProjectPhase: { id: `phase-${phaseNumber}` } };
    }

    return {};
  });
});

describe('shouldSeedProjectTemplate', () => {
  it('seeds an active project that has an offer and no phase', () => {
    expect(
      shouldSeedProjectTemplate({ offer: 'WEB', status: 'IN_PROGRESS', phaseCount: 0 }),
    ).toBe(true);
    expect(
      shouldSeedProjectTemplate({ offer: 'WEB', status: 'LAUNCHED', phaseCount: 0 }),
    ).toBe(true);
  });

  it('never seeds without offer, when archived or when phases exist', () => {
    expect(
      shouldSeedProjectTemplate({ offer: null, status: 'IN_PROGRESS', phaseCount: 0 }),
    ).toBe(false);
    expect(
      shouldSeedProjectTemplate({ offer: 'WEB', status: 'ARCHIVED', phaseCount: 0 }),
    ).toBe(false);
    expect(
      shouldSeedProjectTemplate({ offer: 'WEB', status: 'IN_PROGRESS', phaseCount: 1 }),
    ).toBe(false);
  });
});

describe('seedProjectTemplate', () => {
  it('creates the WebFaze phases in order, then their tasks', async () => {
    givenProject({ offer: 'WEB', status: 'IN_PROGRESS' });

    const result = await seedProjectTemplate(client, PROJECT_ID);

    expect(result).toEqual({ seeded: true });
    expect(mutationArgs(client, 'createProjectPhase')).toEqual([
      { data: { name: 'On échange', position: 0, projectId: PROJECT_ID } },
      { data: { name: 'Vous validez le design', position: 1, projectId: PROJECT_ID } },
      { data: { name: 'On le construit', position: 2, projectId: PROJECT_ID } },
      { data: { name: 'Mise en ligne', position: 3, projectId: PROJECT_ID } },
    ]);
    expect(mutationArgs(client, 'createProjectTasks')[2]).toEqual({
      data: [
        { name: 'Pages développées', position: 0, status: 'TODO', phaseId: 'phase-3', projectId: PROJECT_ID },
        { name: 'Textes et images intégrés', position: 1, status: 'TODO', phaseId: 'phase-3', projectId: PROJECT_ID },
        { name: 'Référencement Google configuré', position: 2, status: 'TODO', phaseId: 'phase-3', projectId: PROJECT_ID },
      ],
    });
    expect(
      mutationArgs(client, 'createProjectTasks').flatMap(
        (args) => args.data as unknown[],
      ),
    ).toHaveLength(10);
  });

  it('leaves a project that already has a phase untouched', async () => {
    givenProject({ offer: 'WEB', status: 'IN_PROGRESS' }, ['existing-phase']);

    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({ seeded: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('leaves a project without offer or archived untouched', async () => {
    givenProject({ offer: null, status: 'IN_PROGRESS' });
    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({ seeded: false });

    givenProject({ offer: 'APP', status: 'ARCHIVED' });
    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({ seeded: false });

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('does nothing when the project no longer exists', async () => {
    client.query.mockResolvedValueOnce({ project: null, projectPhases: connection([]) });

    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({ seeded: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });
});
