import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import onProjectChanged from 'src/logic-functions/on-project-changed';
import { handleProjectEvent } from 'src/utils/seed-project-template';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

const functionClient = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  // A constructor that returns an object hands that object to `new`.
  CoreApiClient: vi.fn(function CoreApiClient() {
    return functionClient;
  }),
}));

let client: MockRecordApiClient;

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  client = createMockRecordApiClient();
  client.query.mockResolvedValue({ project: null });
});

describe('on-project-changed', () => {
  it('listens to every project event', () => {
    expect(onProjectChanged.success).toBe(true);
    expect(onProjectChanged.config.databaseEventTriggerSettings).toEqual({
      eventName: 'project.*',
    });
  });

  it('seeds the template when a project is created', async () => {
    await handleProjectEvent(client, {
      name: 'project.created',
      recordId: PROJECT_ID,
      properties: {},
    });

    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('seeds the template when the offer of a project changes', async () => {
    await handleProjectEvent(client, {
      name: 'project.updated',
      recordId: PROJECT_ID,
      properties: { updatedFields: ['offer'] },
    });

    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('ignores the progress written by the app itself', async () => {
    await handleProjectEvent(client, {
      name: 'project.updated',
      recordId: PROJECT_ID,
      properties: { updatedFields: ['progress', 'currentPhase'] },
    });

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('ignores a deleted project', async () => {
    await handleProjectEvent(client, {
      name: 'project.deleted',
      recordId: PROJECT_ID,
      properties: {},
    });

    expect(client.query).not.toHaveBeenCalled();
  });
});

describe('on-project-changed handler', () => {
  it('marks a project launched when its launch date is set', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('LEAD_OWNER_EMAIL', '');
    answerQueries(functionClient as MockRecordApiClient, {
      projects: () => [
        {
          id: PROJECT_ID,
          name: 'Boulangerie Dupont · WebFaze',
          status: 'IN_PROGRESS',
          launchedAt: '2026-11-07',
          ownerId: 'owner-1',
          company: null,
        },
      ],
      project: () => null,
    });
    functionClient.mutation.mockImplementation(async (request) =>
      'createTask' in request ? { createTask: { id: 'task-new' } } : {},
    );

    await onProjectChanged.config.handler(
      {
        name: 'project.updated',
        recordId: PROJECT_ID,
        properties: { updatedFields: ['launchedAt'] },
      } as unknown as Parameters<typeof onProjectChanged.config.handler>[0],
      {} as Parameters<typeof onProjectChanged.config.handler>[1],
    );

    expect(
      mutationArgs(functionClient as MockRecordApiClient, 'updateProject'),
    ).toEqual([{ id: PROJECT_ID, data: { status: 'LAUNCHED' } }]);
  });
});
