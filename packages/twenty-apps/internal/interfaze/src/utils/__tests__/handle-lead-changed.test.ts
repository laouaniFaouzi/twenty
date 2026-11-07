import { beforeEach, describe, expect, it } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
  type QueryAnswers,
  queryFilters,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import {
  findLeadOpportunity,
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import { type SiteLead } from 'src/utils/lead-mapping';
import { type SiteLeadStatus } from 'src/utils/supabase-leads';

const LEAD: SiteLead = {
  id: 'L1',
  ref: 'IFZ-261106-0042',
  source: 'contact',
  need: 'web',
  timing: null,
  name: 'Marie Curie',
  company: 'Boulangerie Martin',
  email: 'marie@exemple.fr',
  phone: null,
  message: null,
  status: 'new',
  crm_id: 'O1',
  created_at: '2023-11-06T09:00:00.000Z',
};

const opportunity = (
  stage: InterfazeStage,
  siteLeadStatusSeen: string | null,
  overrides: Record<string, unknown> = {},
) => ({
  id: 'O1',
  name: 'Boulangerie Martin · WebFaze',
  interfazeStage: stage,
  siteLeadId: 'L1',
  siteLeadStatusSeen,
  ownerId: 'M1',
  pointOfContactId: 'P1',
  companyId: 'C1',
  ...overrides,
});

let client: MockRecordApiClient;

const givenOpportunity = (
  node: ReturnType<typeof opportunity> | null,
  extraAnswers: QueryAnswers = {},
) =>
  answerQueries(client, {
    opportunities: (filter) =>
      'or' in filter || 'id' in filter || 'siteLeadId' in filter
        ? node === null
          ? []
          : [node]
        : [],
    ...extraAnswers,
  });

const updated = (status: SiteLeadStatus) => ({ ...LEAD, status });

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(
    async (request: Record<string, unknown>) => {
      const name = Object.keys(request)[0];

      return { [name]: { id: name === 'createTask' ? 'T-new' : `${name}-id` } };
    },
  );
});

describe('findLeadOpportunity', () => {
  it('looks the opportunity up by the lead crm_id or by its site lead id', async () => {
    givenOpportunity(opportunity('NEW_REQUEST', 'new'));

    expect(await findLeadOpportunity(client, LEAD)).toMatchObject({ id: 'O1' });
    expect(queryFilters(client, 'opportunities')).toEqual([
      { or: [{ id: { eq: 'O1' } }, { siteLeadId: { eq: 'L1' } }] },
    ]);
  });

  it('only uses the site lead id when the lead has no crm_id', async () => {
    givenOpportunity(opportunity('NEW_REQUEST', 'new'));

    await findLeadOpportunity(client, { id: 'L1', crm_id: null });

    expect(queryFilters(client, 'opportunities')).toEqual([
      { siteLeadId: { eq: 'L1' } },
    ]);
  });

  it('prefers the opportunity named by crm_id', async () => {
    answerQueries(client, {
      opportunities: () => [
        opportunity('DISCUSSION', 'new', { id: 'O2' }),
        opportunity('NEW_REQUEST', 'new'),
      ],
    });

    expect(await findLeadOpportunity(client, LEAD)).toMatchObject({ id: 'O1' });
  });
});

describe('handleLeadUpdated', () => {
  it('moves a new request to discussion when the site starts working on it', async () => {
    givenOpportunity(opportunity('NEW_REQUEST', 'new'));

    await handleLeadUpdated(client, updated('in_progress'));

    expect(mutationNames(client)).toEqual(['updateOpportunity']);
    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      {
        id: 'O1',
        data: {
          siteLeadStatusSeen: 'in_progress',
          interfazeStage: 'DISCUSSION',
        },
      },
    ]);
  });

  it('only records the status on an opportunity already further along', async () => {
    givenOpportunity(opportunity('QUOTE_SENT', 'new'));

    await handleLeadUpdated(client, updated('in_progress'));

    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: 'O1', data: { siteLeadStatusSeen: 'in_progress' } },
    ]);
  });

  it('asks the owner to close an open opportunity when the site closes the lead', async () => {
    givenOpportunity(opportunity('DISCUSSION', 'in_progress'));

    await handleLeadUpdated(client, updated('done'));

    expect(mutationNames(client)).toEqual([
      'updateOpportunity',
      'createTask',
      'createTaskTarget',
    ]);
    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: 'O1', data: { siteLeadStatusSeen: 'done' } },
    ]);
    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title:
            'Demande IFZ-261106-0042 clôturée sur le site : passer en Signé ou Perdu',
          status: 'TODO',
          assigneeId: 'M1',
          dueAt: null,
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'T-new', targetOpportunityId: 'O1' } },
    ]);
  });

  it('does not ask to close a signed opportunity', async () => {
    givenOpportunity(opportunity('WON', 'in_progress'));

    await handleLeadUpdated(client, updated('done'));

    expect(mutationNames(client)).toEqual(['updateOpportunity']);
  });

  it('records a step back without moving the opportunity', async () => {
    givenOpportunity(opportunity('DISCUSSION', 'in_progress'));

    await handleLeadUpdated(client, updated('new'));

    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: 'O1', data: { siteLeadStatusSeen: 'new' } },
    ]);
  });

  it('does nothing when the status did not change, for example when the site marks the email sent', async () => {
    givenOpportunity(opportunity('DISCUSSION', 'in_progress'));

    await handleLeadUpdated(client, updated('in_progress'));

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('ignores a lead HubFaze does not know', async () => {
    givenOpportunity(null);

    await expect(
      handleLeadUpdated(client, updated('done')),
    ).resolves.toBeUndefined();
    expect(client.mutation).not.toHaveBeenCalled();
  });
});

describe('handleLeadDeleted', () => {
  const REPLY_TITLE = 'Répondre à Marie Curie · IFZ-261106-0042';
  const CLOSE_TITLE =
    'Demande IFZ-261106-0042 clôturée sur le site : passer en Signé ou Perdu';

  type World = {
    stage?: InterfazeStage;
    personCompanyId?: string | null;
    clientStatus?: string;
    otherOpportunitiesOfPerson?: number;
    companyRecords?: Partial<
      Record<
        'opportunities' | 'projects' | 'maintenanceContracts' | 'people',
        number
      >
    >;
    tasks?: { id: string; title: string }[];
  };

  const records = (count = 0) =>
    Array.from({ length: count }, (_, index) => ({ id: `X${index}` }));

  const givenWorld = ({
    stage = 'DISCUSSION',
    personCompanyId = 'C1',
    clientStatus = 'PROSPECT',
    otherOpportunitiesOfPerson = 0,
    companyRecords = {},
    tasks = [],
  }: World = {}) =>
    answerQueries(client, {
      opportunities: (filter) =>
        'or' in filter
          ? [opportunity(stage, 'in_progress')]
          : 'pointOfContactId' in filter
            ? records(otherOpportunitiesOfPerson)
            : records(companyRecords.opportunities),
      people: (filter) =>
        'id' in filter
          ? [{ id: 'P1', companyId: personCompanyId }]
          : records(companyRecords.people),
      companies: () => [{ id: 'C1', clientStatus }],
      projects: () => records(companyRecords.projects),
      maintenanceContracts: () => records(companyRecords.maintenanceContracts),
      tasks: () => tasks,
    });

  it('deletes an unsigned opportunity, its tasks, then the person and the company left without links', async () => {
    givenWorld({
      tasks: [
        { id: 'T1', title: REPLY_TITLE },
        { id: 'T2', title: CLOSE_TITLE },
      ],
    });

    await handleLeadDeleted(client, LEAD);

    expect(queryFilters(client, 'tasks')).toEqual([
      {
        or: [
          { title: { ilike: 'Répondre à % · IFZ-261106-0042' } },
          { title: { eq: CLOSE_TITLE } },
        ],
      },
    ]);
    expect(mutationNames(client)).toEqual([
      'deleteOpportunity',
      'deleteTask',
      'deleteTask',
      'deletePerson',
      'deleteCompany',
    ]);
    expect(mutationArgs(client, 'deleteOpportunity')).toEqual([{ id: 'O1' }]);
    expect(mutationArgs(client, 'deleteTask')).toEqual([
      { id: 'T1' },
      { id: 'T2' },
    ]);
    expect(mutationArgs(client, 'deletePerson')).toEqual([{ id: 'P1' }]);
    expect(mutationArgs(client, 'deleteCompany')).toEqual([{ id: 'C1' }]);
  });

  it('keeps a person who has another opportunity, and the company of a kept person', async () => {
    givenWorld({
      otherOpportunitiesOfPerson: 1,
      companyRecords: { people: 1 },
    });

    await handleLeadDeleted(client, LEAD);

    expect(mutationNames(client)).toEqual(['deleteOpportunity']);
  });

  it.each([
    ['a client', { clientStatus: 'CLIENT' }],
    ['a former client', { clientStatus: 'FORMER_CLIENT' }],
    ['a company with a project', { companyRecords: { projects: 1 } }],
    [
      'a company with a maintenance contract',
      { companyRecords: { maintenanceContracts: 1 } },
    ],
  ] as const)('keeps a contact of %s, and the company', async (_, world) => {
    givenWorld(world);

    await handleLeadDeleted(client, LEAD);

    expect(mutationNames(client)).toEqual(['deleteOpportunity']);
  });

  it.each([
    ['another opportunity', { opportunities: 1 }],
    ['another person', { people: 1 }],
  ])(
    'keeps a prospect company that still has %s, deleting the person',
    async (_, companyRecords) => {
      givenWorld({ companyRecords });

      await handleLeadDeleted(client, LEAD);

      expect(mutationNames(client)).toEqual([
        'deleteOpportunity',
        'deletePerson',
      ]);
    },
  );

  it('deletes a person without a company and the prospect company of the lead', async () => {
    givenWorld({ personCompanyId: null });

    await handleLeadDeleted(client, LEAD);

    expect(mutationNames(client)).toEqual([
      'deleteOpportunity',
      'deletePerson',
      'deleteCompany',
    ]);
  });

  it('keeps a signed opportunity and everything around it', async () => {
    givenWorld({ stage: 'WON', tasks: [{ id: 'T1', title: REPLY_TITLE }] });

    await handleLeadDeleted(client, LEAD);

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('only deletes the note and the tasks of a lead added to another opportunity', async () => {
    answerQueries(client, {
      notes: () => [{ id: 'N1' }],
      tasks: () => [{ id: 'T1', title: REPLY_TITLE }],
    });

    await handleLeadDeleted(client, { ...LEAD, crm_id: null });

    expect(queryFilters(client, 'notes')).toEqual([
      { title: { eq: 'Nouvelle demande IFZ-261106-0042' } },
    ]);
    expect(mutationNames(client)).toEqual(['deleteNote', 'deleteTask']);
    expect(mutationArgs(client, 'deleteNote')).toEqual([{ id: 'N1' }]);
  });

  it('does nothing for a lead HubFaze never received', async () => {
    answerQueries(client, {});

    await handleLeadDeleted(client, { ...LEAD, crm_id: null });

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('purges a lead known only by its id, reference and opportunity, as the reconciliation does', async () => {
    givenWorld({ tasks: [{ id: 'T1', title: REPLY_TITLE }] });

    await handleLeadDeleted(client, {
      id: 'L1',
      ref: 'IFZ-261106-0042',
      crm_id: 'O1',
    });

    expect(mutationNames(client)).toEqual([
      'deleteOpportunity',
      'deleteTask',
      'deletePerson',
      'deleteCompany',
    ]);
  });
});
