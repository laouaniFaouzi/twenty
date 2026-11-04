import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  handleOpportunityCreation,
  handleOpportunityUpdate,
} from 'src/utils/handle-opportunity-update';

const OPPORTUNITY_ID = 'opportunity-1';
const NOW = new Date('2026-11-04T10:00:00.000Z');

const OPPORTUNITY = {
  id: OPPORTUNITY_ID,
  name: 'Refonte du site',
  interfazeStage: 'WON',
  offer: 'WEB',
  closeDate: null,
  ownerId: 'member-1',
  amount: { amountMicros: 4_800_000_000, currencyCode: 'EUR' },
  company: { id: 'company-1', name: 'Boulangerie Martin', clientStatus: 'PROSPECT' },
};

let client: MockRecordApiClient;

const givenOpportunity = (
  overrides: Partial<typeof OPPORTUNITY> | Record<string, unknown> = {},
  projectIds: string[] = [],
) => {
  client.query.mockImplementation(async (request) => {
    if ('opportunity' in request) {
      return {
        opportunity: { ...OPPORTUNITY, ...overrides },
        projects: connection(projectIds.map((id) => ({ id }))),
      };
    }

    return { taskTargets: connection([]) };
  });
};

const wonFrom = (before: string) => ({
  recordId: OPPORTUNITY_ID,
  properties: {
    before: { interfazeStage: before as 'QUOTE_SENT' },
    updatedFields: ['interfazeStage'],
  },
});

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(async (request) =>
    'createTask' in request ? { createTask: { id: 'task-new' } } : {},
  );
});

describe('handleOpportunityUpdate', () => {
  it('signs the deal: close date, client company and project', async () => {
    givenOpportunity();

    await handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW);

    expect(client.query.mock.calls[0][0].projects.__args.filter).toEqual({
      opportunityId: { eq: OPPORTUNITY_ID },
    });
    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: OPPORTUNITY_ID, data: { closeDate: '2026-11-04T10:00:00.000Z' } },
    ]);
    expect(mutationArgs(client, 'updateCompany')).toEqual([
      { id: 'company-1', data: { clientStatus: 'CLIENT' } },
    ]);
    expect(mutationArgs(client, 'createProject')).toEqual([
      {
        data: {
          id: OPPORTUNITY_ID,
          name: 'Boulangerie Martin · WebFaze',
          offer: 'WEB',
          status: 'IN_PROGRESS',
          opportunityId: OPPORTUNITY_ID,
          companyId: 'company-1',
          ownerId: 'member-1',
          price: { amountMicros: 4_800_000_000, currencyCode: 'EUR' },
        },
      },
    ]);
  });

  it('keeps a close date that is already set', async () => {
    givenOpportunity({ closeDate: '2026-10-30T00:00:00.000Z' });

    await handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW);

    expect(mutationNames(client)).not.toContain('updateOpportunity');
  });

  it('does not touch a company that is already a client', async () => {
    givenOpportunity({
      company: { id: 'company-1', name: 'Boulangerie Martin', clientStatus: 'CLIENT' },
    });

    await handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW);

    expect(mutationNames(client)).not.toContain('updateCompany');
  });

  it('names the project after the opportunity when there is no company', async () => {
    givenOpportunity({ company: null });

    await handleOpportunityUpdate(client, wonFrom('DISCUSSION'), NOW);

    expect(mutationNames(client)).not.toContain('updateCompany');
    expect(mutationArgs(client, 'createProject')[0]).toMatchObject({
      data: { name: 'Refonte du site · WebFaze', companyId: null },
    });
  });

  it('asks the owner to choose the offer when a deal is won without one', async () => {
    givenOpportunity({ offer: null });

    await handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW);

    expect(mutationNames(client)).not.toContain('createProject');
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
      { data: { taskId: 'task-new', targetOpportunityId: OPPORTUNITY_ID } },
    ]);
  });

  it('creates the project once the offer is set on a won deal', async () => {
    givenOpportunity({ closeDate: '2026-11-04T10:00:00.000Z' });

    await handleOpportunityUpdate(
      client,
      {
        recordId: OPPORTUNITY_ID,
        properties: { before: { interfazeStage: 'WON' }, updatedFields: ['offer'] },
      },
      NOW,
    );

    expect(mutationNames(client)).toEqual(['createProject']);
  });

  it('never creates a second project for the same opportunity', async () => {
    givenOpportunity({}, ['project-1']);

    await handleOpportunityUpdate(client, wonFrom('DISCUSSION'), NOW);

    expect(mutationNames(client)).not.toContain('createProject');
  });

  it('does nothing while the deal is not won', async () => {
    givenOpportunity({ interfazeStage: 'DISCUSSION' });

    await handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW);

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('does nothing when the stage was already won', async () => {
    givenOpportunity();

    await handleOpportunityUpdate(client, wonFrom('WON'), NOW);

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('ignores the duplicate when a concurrent signature already created the project', async () => {
    let projectQueries = 0;
    client.query.mockImplementation(async (request) => {
      if ('opportunity' in request) {
        return { opportunity: OPPORTUNITY, projects: connection([]) };
      }
      projectQueries += 1;

      return { projects: connection([{ id: OPPORTUNITY_ID }]) };
    });
    client.mutation.mockImplementation(async (request) => {
      if ('createProject' in request) {
        throw new Error('duplicate key value violates unique constraint');
      }

      return {};
    });

    await expect(
      handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW),
    ).resolves.toBeUndefined();
    expect(projectQueries).toBe(1);
  });

  it('rethrows a project creation failure when no project exists', async () => {
    client.query.mockImplementation(async (request) =>
      'opportunity' in request
        ? { opportunity: OPPORTUNITY, projects: connection([]) }
        : { projects: connection([]) },
    );
    client.mutation.mockImplementation(async (request) => {
      if ('createProject' in request) {
        throw new Error('server unavailable');
      }

      return {};
    });

    await expect(
      handleOpportunityUpdate(client, wonFrom('QUOTE_SENT'), NOW),
    ).rejects.toThrow('server unavailable');
  });
});

describe('handleOpportunityCreation', () => {
  it('signs an opportunity created directly in the won column', async () => {
    givenOpportunity();

    await handleOpportunityCreation(
      client,
      { recordId: OPPORTUNITY_ID, properties: { after: { interfazeStage: 'WON' } } },
      NOW,
    );

    expect(mutationNames(client)).toEqual([
      'updateOpportunity',
      'updateCompany',
      'createProject',
    ]);
  });

  it('ignores an opportunity created in any other stage', async () => {
    await handleOpportunityCreation(
      client,
      { recordId: OPPORTUNITY_ID, properties: { after: { interfazeStage: 'NEW_REQUEST' } } },
      NOW,
    );

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });
});
