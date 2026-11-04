import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
} from 'src/__tests__/utils/create-mock-record-api-client';
import onProjectChanged from 'src/logic-functions/on-project-changed';
import { handleProjectEvent } from 'src/utils/seed-project-template';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';

let client: MockRecordApiClient;

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
