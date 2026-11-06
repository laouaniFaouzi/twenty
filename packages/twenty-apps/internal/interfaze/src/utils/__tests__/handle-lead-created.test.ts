import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerQueries,
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
  type QueryAnswers,
  queryFilters as sharedQueryFilters,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  findMemberIdByEmail,
  handleLeadCreated,
} from 'src/utils/handle-lead-created';
import {
  mapLeadToOpportunityData,
  type SiteLead,
} from 'src/utils/lead-mapping';
import { type patchSiteLead } from 'src/utils/supabase-leads';
import { type SyncSettings } from 'src/utils/sync-settings';

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: 'tim@apple.dev',
};

const LEAD: SiteLead = {
  id: 'L1',
  ref: 'IFZ-261106-0042',
  source: 'offre:web',
  need: 'web',
  timing: '1-3-mois',
  name: 'Marie Curie',
  company: 'Boulangerie Martin',
  email: 'marie@exemple.fr',
  phone: '06 12 34 56 78',
  message: 'Un site pour la boulangerie',
  status: 'new',
  crm_id: null,
  created_at: '2026-11-06T09:00:00.000Z',
};

const CREATED_IDS: Record<string, string> = {
  createCompany: 'C-new',
  createPerson: 'P-new',
  createOpportunity: 'O-new',
  createNote: 'N-new',
  createTask: 'T-new',
};

let client: MockRecordApiClient;
let patchLead: ReturnType<typeof vi.fn<typeof patchSiteLead>>;

const answer = (answers: QueryAnswers) => answerQueries(client, answers);

const queryFilters = (root: string) => sharedQueryFilters(client, root);

const REPLY_TITLE = 'Répondre à Marie Curie · IFZ-261106-0042';

const ownerAnswer = { workspaceMembers: () => [{ id: 'M1' }] };

const run = (lead: SiteLead = LEAD) =>
  handleLeadCreated(client, lead, { settings: SETTINGS, patchLead });

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(
    async (request: Record<string, unknown>) => {
      const name = Object.keys(request)[0];

      return { [name]: { id: CREATED_IDS[name] ?? `${name}-id` } };
    },
  );
  patchLead = vi.fn<typeof patchSiteLead>().mockResolvedValue(undefined);
});

describe('handleLeadCreated', () => {
  it('creates the company, the person, the opportunity and the reply task, then links the lead', async () => {
    answer(ownerAnswer);

    expect(await run()).toEqual({ outcome: 'created', opportunityId: 'O-new' });

    expect(mutationNames(client)).toEqual([
      'createCompany',
      'createPerson',
      'createOpportunity',
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
    expect(mutationArgs(client, 'createCompany')).toEqual([
      { data: { name: 'Boulangerie Martin', clientStatus: 'PROSPECT' } },
    ]);
    expect(mutationArgs(client, 'createPerson')).toEqual([
      {
        upsert: true,
        data: {
          name: { firstName: 'Marie', lastName: 'Curie' },
          emails: { primaryEmail: 'marie@exemple.fr' },
          phones: {
            primaryPhoneNumber: '612345678',
            primaryPhoneCallingCode: '+33',
            primaryPhoneCountryCode: 'FR',
          },
          companyId: 'C-new',
        },
      },
    ]);
    expect(mutationArgs(client, 'createOpportunity')).toEqual([
      {
        data: mapLeadToOpportunityData(LEAD, {
          personId: 'P-new',
          companyId: 'C-new',
          ownerId: 'M1',
          companyName: 'Boulangerie Martin',
        }),
      },
    ]);
    expect(mutationArgs(client, 'createTask')).toEqual([
      {
        data: {
          title: 'Répondre à Marie Curie · IFZ-261106-0042',
          status: 'TODO',
          assigneeId: 'M1',
          dueAt: '2026-11-08T09:00:00.000Z',
        },
      },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'T-new', targetOpportunityId: 'O-new' } },
      { data: { taskId: 'T-new', targetPersonId: 'P-new' } },
    ]);
    expect(patchLead).toHaveBeenCalledWith(SETTINGS, 'L1', { crm_id: 'O-new' });
  });

  it('finds an existing person by email whatever the case', async () => {
    answer({
      ...ownerAnswer,
      people: () => [
        {
          id: 'P1',
          companyId: 'C1',
          company: { id: 'C1', name: 'Boulangerie Martin' },
        },
      ],
      companies: () => [{ id: 'C1', name: 'Boulangerie Martin' }],
    });

    await run({ ...LEAD, email: ' MARIE@Exemple.fr ' });

    expect(queryFilters('people')).toEqual([
      { emails: { primaryEmail: { ilike: 'MARIE@Exemple.fr' } } },
    ]);
    expect(mutationNames(client)).toEqual([
      'createOpportunity',
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
  });

  it('never lets an underscore in the email match another person', async () => {
    answer(ownerAnswer);

    await run({ ...LEAD, email: 'marie_curie@exemple.fr' });

    expect(queryFilters('people')).toEqual([
      { emails: { primaryEmail: { ilike: 'marie\\_curie@exemple.fr' } } },
    ]);
  });

  it('finds an existing company written with other accents, case and spaces', async () => {
    answer({
      ...ownerAnswer,
      companies: () => [
        { id: 'C10', name: 'Boulangerie Émile et Fils' },
        { id: 'C9', name: 'Boulangerie Émile  ' },
      ],
    });

    await run({ ...LEAD, company: 'boulangerie emile' });

    expect(queryFilters('companies')).toEqual([
      { name: { ilike: '%b__l__g_r__%_m_l_%' } },
    ]);
    expect(mutationNames(client)).not.toContain('createCompany');
    expect(mutationArgs(client, 'createPerson')[0]).toMatchObject({
      data: { companyId: 'C9' },
    });
    expect(mutationArgs(client, 'createOpportunity')[0]).toMatchObject({
      data: { name: 'Boulangerie Émile · WebFaze', companyId: 'C9' },
    });
  });

  it('attaches an existing person without a company to the lead company', async () => {
    answer({
      ...ownerAnswer,
      people: () => [{ id: 'P1', companyId: null, company: null }],
    });

    await run();

    expect(mutationNames(client).slice(0, 2)).toEqual([
      'createCompany',
      'updatePerson',
    ]);
    expect(mutationArgs(client, 'updatePerson')).toEqual([
      { id: 'P1', data: { companyId: 'C-new' } },
    ]);
  });

  it('keeps the company of a known person when the lead names none', async () => {
    answer({
      ...ownerAnswer,
      people: () => [
        {
          id: 'P1',
          companyId: 'C1',
          company: { id: 'C1', name: 'Atelier Curie' },
        },
      ],
    });

    await run({ ...LEAD, company: '  ' });

    expect(
      client.query.mock.calls.some(([request]) => 'companies' in request),
    ).toBe(false);
    expect(mutationArgs(client, 'createOpportunity')[0]).toMatchObject({
      data: { name: 'Atelier Curie · WebFaze', companyId: 'C1' },
    });
  });

  it('adds the lead as a note to an open opportunity of the same person', async () => {
    answer({
      ...ownerAnswer,
      people: () => [
        {
          id: 'P1',
          companyId: 'C1',
          company: { id: 'C1', name: 'Boulangerie Martin' },
        },
      ],
      companies: () => [{ id: 'C1', name: 'Boulangerie Martin' }],
      opportunities: (filter) =>
        'pointOfContactId' in filter ? [{ id: 'O7' }] : [],
    });

    expect(await run()).toEqual({ outcome: 'noted', opportunityId: 'O7' });

    expect(queryFilters('opportunities')).toContainEqual({
      pointOfContactId: { eq: 'P1' },
      interfazeStage: { in: ['NEW_REQUEST', 'DISCUSSION', 'QUOTE_SENT'] },
    });
    expect(mutationNames(client)).toEqual([
      'createNote',
      'createNoteTarget',
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
    expect(mutationArgs(client, 'createNote')).toEqual([
      {
        data: {
          title: 'Nouvelle demande IFZ-261106-0042',
          bodyV2: {
            markdown: [
              'Référence : IFZ-261106-0042',
              'Besoin : WebFaze',
              'Source : Page WebFaze',
              'Délai : 1 à 3 mois',
              'Téléphone : 06 12 34 56 78',
              'Message : Un site pour la boulangerie',
            ].join('\n\n'),
            blocknote: null,
          },
        },
      },
    ]);
    expect(mutationArgs(client, 'createNoteTarget')).toEqual([
      { data: { noteId: 'N-new', targetOpportunityId: 'O7' } },
    ]);
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'T-new', targetOpportunityId: 'O7' } },
      { data: { taskId: 'T-new', targetPersonId: 'P1' } },
    ]);
    // crm_id is unique on the site: the opportunity already belongs to the first lead.
    expect(patchLead).not.toHaveBeenCalled();
  });

  it('leaves empty details out of the note', async () => {
    answer({
      people: () => [{ id: 'P1', companyId: null, company: null }],
      opportunities: (filter) =>
        'pointOfContactId' in filter ? [{ id: 'O7' }] : [],
    });

    await run({
      ...LEAD,
      company: null,
      timing: null,
      phone: ' ',
      message: null,
    });

    expect(mutationArgs(client, 'createNote')[0]).toMatchObject({
      data: {
        bodyV2: {
          markdown: [
            'Référence : IFZ-261106-0042',
            'Besoin : WebFaze',
            'Source : Page WebFaze',
          ].join('\n\n'),
        },
      },
    });
  });

  it('does nothing for a lead already turned into an opportunity, even once its reply task is done', async () => {
    answer({
      ...ownerAnswer,
      opportunities: (filter) =>
        'siteLeadId' in filter ? [{ id: 'O-old', pointOfContactId: 'P1' }] : [],
      taskTargets: () => [
        { id: 'TT1', task: { id: 'T1', title: REPLY_TITLE, status: 'DONE' } },
      ],
    });

    expect(await run({ ...LEAD, crm_id: 'O-old' })).toEqual({
      outcome: 'duplicate',
      opportunityId: 'O-old',
    });
    expect(queryFilters('opportunities')[0]).toEqual({
      siteLeadId: { eq: 'L1' },
    });
    expect(client.mutation).not.toHaveBeenCalled();
    expect(patchLead).not.toHaveBeenCalled();
  });

  it('finishes a replayed lead whose run stopped before the reply task', async () => {
    answer({
      ...ownerAnswer,
      opportunities: (filter) =>
        'siteLeadId' in filter ? [{ id: 'O-old', pointOfContactId: 'P1' }] : [],
    });

    expect(await run({ ...LEAD, crm_id: 'O-old' })).toMatchObject({
      outcome: 'duplicate',
    });
    expect(mutationNames(client)).toEqual([
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
    expect(mutationArgs(client, 'createTask')[0]).toMatchObject({
      data: { title: REPLY_TITLE, assigneeId: 'M1' },
    });
    expect(mutationArgs(client, 'createTaskTarget')).toEqual([
      { data: { taskId: 'T-new', targetOpportunityId: 'O-old' } },
      { data: { taskId: 'T-new', targetPersonId: 'P1' } },
    ]);
  });

  it('links the lead again when a replay finds it without its opportunity', async () => {
    answer({
      opportunities: (filter) =>
        'siteLeadId' in filter ? [{ id: 'O-old', pointOfContactId: 'P1' }] : [],
      taskTargets: () => [
        { id: 'TT1', task: { id: 'T1', title: REPLY_TITLE, status: 'TODO' } },
      ],
    });

    await run();

    expect(client.mutation).not.toHaveBeenCalled();
    expect(patchLead).toHaveBeenCalledWith(SETTINGS, 'L1', { crm_id: 'O-old' });
  });

  it('does nothing for a lead already added as a note', async () => {
    answer({
      notes: () => [
        {
          id: 'N1',
          noteTargets: connection([{ id: 'NT1', targetOpportunityId: 'O7' }]),
        },
      ],
      taskTargets: () => [
        { id: 'TT1', task: { id: 'T1', title: REPLY_TITLE, status: 'DONE' } },
      ],
    });

    expect(await run()).toEqual({ outcome: 'duplicate', opportunityId: 'O7' });
    expect(queryFilters('notes')).toEqual([
      { title: { eq: 'Nouvelle demande IFZ-261106-0042' } },
    ]);
    expect(client.mutation).not.toHaveBeenCalled();
    expect(patchLead).not.toHaveBeenCalled();
  });

  it('attaches a replayed note that lost its opportunity instead of writing it twice', async () => {
    answer({
      ...ownerAnswer,
      notes: () => [{ id: 'N1', noteTargets: connection([]) }],
      people: () => [
        {
          id: 'P1',
          companyId: 'C1',
          company: { id: 'C1', name: 'Boulangerie Martin' },
        },
      ],
      companies: () => [{ id: 'C1', name: 'Boulangerie Martin' }],
      opportunities: (filter) =>
        'pointOfContactId' in filter ? [{ id: 'O7' }] : [],
    });

    expect(await run()).toEqual({ outcome: 'noted', opportunityId: 'O7' });
    expect(mutationNames(client)).toEqual([
      'createNoteTarget',
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
    expect(mutationArgs(client, 'createNoteTarget')).toEqual([
      { data: { noteId: 'N1', targetOpportunityId: 'O7' } },
    ]);
  });

  it('writes the visitor message as plain text, never as markdown the note would render', async () => {
    answer({
      people: () => [{ id: 'P1', companyId: null, company: null }],
      opportunities: (filter) =>
        'pointOfContactId' in filter ? [{ id: 'O7' }] : [],
    });

    await run({
      ...LEAD,
      company: null,
      timing: null,
      phone: '<b>06</b>',
      message: '![suivi](https://pixel.test/p.png) **urgent**',
    });

    expect(mutationArgs(client, 'createNote')[0]).toMatchObject({
      data: {
        bodyV2: {
          markdown: [
            'Référence : IFZ-261106-0042',
            'Besoin : WebFaze',
            'Source : Page WebFaze',
            'Téléphone : \\<b\\>06\\</b\\>',
            'Message : \\!\\[suivi\\]\\(https://pixel\\.test/p\\.png\\) \\*\\*urgent\\*\\*',
          ].join('\n\n'),
        },
      },
    });
  });

  it('creates the opportunity and the task without an owner when the lead owner is unknown', async () => {
    answer({});

    await run();

    expect(mutationArgs(client, 'createOpportunity')[0]).toMatchObject({
      data: { ownerId: null },
    });
    expect(mutationArgs(client, 'createTask')[0]).toMatchObject({
      data: { assigneeId: null },
    });
  });

  it('creates the person without a phone when the server refuses the number', async () => {
    answer(ownerAnswer);
    client.mutation.mockImplementation(
      async (request: Record<string, unknown>) => {
        const name = Object.keys(request)[0];
        const data = (
          request[name] as { __args: { data: Record<string, unknown> } }
        ).__args.data;

        if (name === 'createPerson' && 'phones' in data) {
          throw new Error('Provided phone number is invalid');
        }

        return { [name]: { id: CREATED_IDS[name] ?? `${name}-id` } };
      },
    );

    expect(await run({ ...LEAD, phone: '+999 123 456 789' })).toMatchObject({
      outcome: 'created',
    });

    const personAttempts = mutationArgs(client, 'createPerson');

    expect(personAttempts).toHaveLength(2);
    expect(personAttempts[1].data).not.toHaveProperty('phones');
  });

  it('lets a failed link to the site surface, keeping the records already created', async () => {
    answer(ownerAnswer);
    patchLead.mockRejectedValue(
      new Error('Supabase a refusé la mise à jour de la demande L1 (401)'),
    );

    await expect(run()).rejects.toThrow('(401)');
    expect(mutationNames(client)).toContain('createOpportunity');
    expect(mutationNames(client)).toContain('createTask');
  });
});

describe('findMemberIdByEmail', () => {
  it('finds the member by email without caring about case', async () => {
    answer(ownerAnswer);

    expect(await findMemberIdByEmail(client, 'Tim@Apple.dev')).toBe('M1');
    expect(queryFilters('workspaceMembers')).toEqual([
      { userEmail: { ilike: 'Tim@Apple.dev' } },
    ]);
  });

  it('returns null without asking when there is no email, and when nobody matches', async () => {
    expect(await findMemberIdByEmail(client, null)).toBeNull();
    expect(client.query).not.toHaveBeenCalled();

    answer({});
    expect(await findMemberIdByEmail(client, 'nobody@apple.dev')).toBeNull();
  });
});
