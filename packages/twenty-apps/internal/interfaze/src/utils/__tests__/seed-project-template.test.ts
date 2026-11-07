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
  project: {
    offer: string | null;
    status: string;
    siteTrackerId?: string | null;
  },
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
      shouldSeedProjectTemplate({
        offer: 'WEB',
        status: 'IN_PROGRESS',
        phaseCount: 0,
        hasSiteTracker: false,
      }),
    ).toBe(true);
    expect(
      shouldSeedProjectTemplate({
        offer: 'WEB',
        status: 'LAUNCHED',
        phaseCount: 0,
        hasSiteTracker: false,
      }),
    ).toBe(true);
  });

  it('never seeds without offer, when archived or when phases exist', () => {
    expect(
      shouldSeedProjectTemplate({
        offer: null,
        status: 'IN_PROGRESS',
        phaseCount: 0,
        hasSiteTracker: false,
      }),
    ).toBe(false);
    expect(
      shouldSeedProjectTemplate({
        offer: 'WEB',
        status: 'ARCHIVED',
        phaseCount: 0,
        hasSiteTracker: false,
      }),
    ).toBe(false);
    expect(
      shouldSeedProjectTemplate({
        offer: 'WEB',
        status: 'IN_PROGRESS',
        phaseCount: 1,
        hasSiteTracker: false,
      }),
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
      {
        data: {
          name: 'Vous validez le design',
          position: 1,
          projectId: PROJECT_ID,
        },
      },
      { data: { name: 'On le construit', position: 2, projectId: PROJECT_ID } },
      { data: { name: 'Mise en ligne', position: 3, projectId: PROJECT_ID } },
    ]);
    expect(mutationArgs(client, 'createProjectTasks')[2]).toEqual({
      data: [
        {
          name: 'Pages développées',
          position: 4,
          status: 'TODO',
          phaseId: 'phase-3',
          projectId: PROJECT_ID,
        },
        {
          name: 'Textes et images intégrés',
          position: 5,
          status: 'TODO',
          phaseId: 'phase-3',
          projectId: PROJECT_ID,
        },
        {
          name: 'Référencement Google configuré',
          position: 6,
          status: 'TODO',
          phaseId: 'phase-3',
          projectId: PROJECT_ID,
        },
      ],
    });
    expect(
      mutationArgs(client, 'createProjectTasks').flatMap(
        (args) => args.data as unknown[],
      ),
    ).toHaveLength(10);
  });

  it('numbers tasks across the whole project so the Suivi tab keeps the phase order', async () => {
    givenProject({ offer: 'WEB', status: 'IN_PROGRESS' });

    await seedProjectTemplate(client, PROJECT_ID);

    const positions = mutationArgs(client, 'createProjectTasks').flatMap(
      (args) =>
        (args.data as { position: number }[]).map((task) => task.position),
    );

    expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('leaves a project that already has a phase untouched', async () => {
    givenProject({ offer: 'WEB', status: 'IN_PROGRESS' }, ['existing-phase']);

    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({
      seeded: false,
    });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('leaves a project without offer or archived untouched', async () => {
    givenProject({ offer: null, status: 'IN_PROGRESS' });
    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({
      seeded: false,
    });

    givenProject({ offer: 'APP', status: 'ARCHIVED' });
    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({
      seeded: false,
    });

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('never seeds a project that came from a tracker of the site, which brings its own phases', async () => {
    expect(
      shouldSeedProjectTemplate({
        offer: 'WEB',
        status: 'IN_PROGRESS',
        phaseCount: 0,
        hasSiteTracker: true,
      }),
    ).toBe(false);

    givenProject({
      offer: 'WEB',
      status: 'IN_PROGRESS',
      siteTrackerId: 'S-T1',
    });

    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({
      seeded: false,
    });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('does nothing when the project no longer exists', async () => {
    client.query.mockResolvedValueOnce({
      project: null,
      projectPhases: connection([]),
    });

    expect(await seedProjectTemplate(client, PROJECT_ID)).toEqual({
      seeded: false,
    });
    expect(client.mutation).not.toHaveBeenCalled();
  });
});
