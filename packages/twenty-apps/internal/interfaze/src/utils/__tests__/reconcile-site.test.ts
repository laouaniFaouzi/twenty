import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  type QueryAnswers,
  queryFilters,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  applySitePhase,
  applySiteTask,
  applySiteTracker,
} from 'src/utils/apply-site-trackers';
import { handleLeadCreated } from 'src/utils/handle-lead-created';
import {
  findLeadOpportunity,
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import { type SiteLead } from 'src/utils/lead-mapping';
import {
  pushPhase,
  pushProjectTree,
  pushTask,
  type TrackerRestClient,
} from 'src/utils/push-trackers';
import { runReconciliation } from 'src/utils/reconcile-site';
import { type SyncSettings } from 'src/utils/sync-settings';
import {
  type SitePhase,
  type SiteTask,
  type SiteTracker,
} from 'src/utils/tracker-mapping';

vi.mock('src/utils/apply-site-trackers', () => ({
  applySiteTracker: vi.fn(async () => undefined),
  applySitePhase: vi.fn(async () => undefined),
  applySiteTask: vi.fn(async () => undefined),
}));

vi.mock('src/utils/push-trackers', () => ({
  pushProjectTree: vi.fn(async () => undefined),
  pushPhase: vi.fn(async () => 'pushed'),
  pushTask: vi.fn(async () => 'pushed'),
}));

vi.mock('src/utils/handle-lead-created', () => ({
  handleLeadCreated: vi.fn(async () => ({
    outcome: 'duplicate',
    opportunityId: 'O1',
  })),
}));

vi.mock('src/utils/handle-lead-changed', () => ({
  findLeadOpportunity: vi.fn(async () => null),
  handleLeadUpdated: vi.fn(async () => undefined),
  handleLeadDeleted: vi.fn(async () => undefined),
}));

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
};

const NOW = new Date('2026-11-07T10:00:00.000Z');
const SINCE = '2026-10-08T10:00:00.000Z';
const OLD = '2026-11-01T10:00:00.000Z';

const tracker = (id: string): SiteTracker => ({
  id,
  client_name: `Client ${id}`,
  offer: 'web',
  token: `code-${id}`,
  is_active: true,
  crm_id: null,
  updated_at: OLD,
});

const PHASE: SitePhase = {
  id: 'S-PH1',
  tracker_id: 'T1',
  name: 'On échange',
  position: 0,
  crm_id: 'PH1',
  updated_at: OLD,
};

const TASK: SiteTask = {
  id: 'S-TA1',
  phase_id: 'S-PH1',
  name: 'Atelier',
  description: '',
  status: 'doing',
  position: 1,
  crm_id: 'TA1',
  updated_at: OLD,
};

const lead = (overrides: Partial<SiteLead> = {}): SiteLead => ({
  id: 'L1',
  ref: 'IFZ-261106-0042',
  source: 'contact',
  need: 'web',
  timing: null,
  name: 'Marie Curie',
  company: null,
  email: 'marie@exemple.fr',
  phone: null,
  message: null,
  status: 'new',
  crm_id: null,
  created_at: OLD,
  ...overrides,
});

type SiteData = {
  trackers?: SiteTracker[];
  trackersById?: SiteTracker[];
  phases?: SitePhase[];
  tasks?: SiteTask[];
  leads?: SiteLead[];
  leadsById?: { id: string }[];
};

let client: MockRecordApiClient;
let fetchSiteRows: ReturnType<typeof vi.fn>;
const patchLead = vi.fn();

const givenSite = ({
  trackers = [],
  trackersById = [],
  phases = [],
  tasks = [],
  leads = [],
  leadsById = [],
}: SiteData) => {
  fetchSiteRows.mockImplementation(
    async (
      _settings: SyncSettings,
      table: string,
      filters: Record<string, string>,
    ) => {
      if (table === 'trackers') {
        return 'id' in filters ? trackersById : trackers;
      }

      if (table === 'tracker_phases') {
        return phases;
      }

      if (table === 'tracker_tasks') {
        return tasks;
      }

      return 'id' in filters ? leadsById : leads;
    },
  );
};

const givenHubFaze = (answers: QueryAnswers) => answerQueries(client, answers);

const run = (full = false) =>
  runReconciliation(
    client,
    {
      settings: SETTINGS,
      patchLead,
      trackers: {
        settings: SETTINGS,
        rest: { fetchSiteRows } as unknown as TrackerRestClient,
        now: () => NOW,
        randomToken: () => 'code',
      },
    },
    { now: NOW, full },
  );

beforeEach(() => {
  vi.clearAllMocks();
  client = createMockRecordApiClient();
  fetchSiteRows = vi.fn(async () => []);
  givenSite({});
  givenHubFaze({});
});

describe('runReconciliation · trackers', () => {
  it('reads active trackers and those changed in 30 days, then their phases and tasks', async () => {
    givenSite({ trackers: [tracker('T1')], phases: [PHASE], tasks: [TASK] });

    await run();

    expect(
      fetchSiteRows.mock.calls.map(([, table, filters]) => [table, filters]),
    ).toEqual(
      expect.arrayContaining([
        ['trackers', { is_active: 'eq.true' }],
        ['trackers', { updated_at: `gte.${SINCE}` }],
        ['tracker_phases', { tracker_id: 'in.(T1)' }],
        ['tracker_tasks', { phase_id: 'in.(S-PH1)' }],
      ]),
    );
    expect(applySiteTracker).toHaveBeenCalledTimes(1);
    expect(applySiteTracker).toHaveBeenCalledWith(
      client,
      tracker('T1'),
      expect.anything(),
    );
    expect(applySitePhase).toHaveBeenCalledWith(
      client,
      PHASE,
      expect.anything(),
    );
    expect(applySiteTask).toHaveBeenCalledWith(client, TASK, expect.anything());
  });

  it('reads everything for the full import', async () => {
    await run(true);

    const filtersByTable = fetchSiteRows.mock.calls.map(
      ([, table, filters]) => [table, filters],
    );

    expect(filtersByTable).toContainEqual(['trackers', {}]);
    expect(filtersByTable).toContainEqual(['leads', {}]);
    expect(filtersByTable).not.toContainEqual([
      'trackers',
      { is_active: 'eq.true' },
    ]);
  });

  it('notes a failed tracker and goes on with the next one', async () => {
    givenSite({ trackers: [tracker('T1'), tracker('T2')] });
    vi.mocked(applySiteTracker).mockRejectedValueOnce(new Error('boom'));

    expect(await run()).toMatchObject({ trackers: 2, failures: 1 });
    expect(applySiteTracker).toHaveBeenCalledTimes(2);
    expect(mutationArgs(client, 'createSyncLog')[0]).toMatchObject({
      data: {
        direction: 'RECONCILIATION',
        entity: 'TRACKER',
        siteId: 'T1',
        error: 'boom',
      },
    });
  });

  it('removes a HubFaze phase the site deleted, sends one it never received, and leaves a fresh one', async () => {
    givenSite({ trackers: [tracker('T1')], phases: [PHASE] });
    givenHubFaze({
      projects: (filter) =>
        'siteTrackerId' in filter && 'in' in (filter.siteTrackerId as object)
          ? [{ id: 'P1', siteTrackerId: 'T1' }]
          : [],
      projectPhases: () => [
        { id: 'PH1', siteId: 'S-PH1', siteUpdatedAt: OLD },
        { id: 'PH-gone', siteId: 'S-gone', siteUpdatedAt: OLD },
        { id: 'PH-new', siteId: null, siteUpdatedAt: null },
        {
          id: 'PH-fresh',
          siteId: 'S-fresh',
          siteUpdatedAt: '2026-11-07T10:00:05.000Z',
        },
      ],
      projectTasks: () => [{ id: 'TA-new', siteId: null, siteUpdatedAt: null }],
    });

    await run();

    expect(mutationArgs(client, 'deleteProjectPhase')).toEqual([
      { id: 'PH-gone' },
    ]);
    expect(pushPhase).toHaveBeenCalledTimes(1);
    expect(pushPhase).toHaveBeenCalledWith(client, 'PH-new', expect.anything());
    expect(pushTask).toHaveBeenCalledWith(client, 'TA-new', expect.anything());
  });

  it('sends a project that never reached the site', async () => {
    givenHubFaze({
      projects: (filter) =>
        JSON.stringify(filter).includes('"is":"NULL"')
          ? [{ id: 'P2', siteTrackerId: null }]
          : [],
    });

    await run();

    expect(queryFilters(client, 'projects')).toContainEqual({
      siteTrackerId: { is: 'NULL' },
      offer: { is: 'NOT_NULL' },
      status: { neq: 'ARCHIVED' },
    });
    expect(pushProjectTree).toHaveBeenCalledWith(
      client,
      'P2',
      expect.anything(),
    );
  });

  it('archives a project whose tracker disappeared, and applies one outside the window', async () => {
    givenSite({
      trackersById: [
        {
          ...tracker('T8'),
          is_active: false,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    givenHubFaze({
      projects: (filter) =>
        JSON.stringify(filter).includes('"is":"NOT_NULL"')
          ? [
              { id: 'P8', siteTrackerId: 'T8' },
              { id: 'P9', siteTrackerId: 'T9' },
            ]
          : [],
    });

    await run();

    expect(fetchSiteRows).toHaveBeenCalledWith(SETTINGS, 'trackers', {
      id: 'in.(T8,T9)',
    });
    expect(applySiteTracker).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ id: 'T8' }),
      expect.anything(),
    );
    expect(mutationArgs(client, 'updateProject')).toEqual([
      {
        id: 'P9',
        data: {
          status: 'ARCHIVED',
          siteTrackerId: null,
          siteUpdatedAt: null,
          syncHash: null,
        },
      },
    ]);
  });
});

describe('runReconciliation · leads', () => {
  it('creates or completes an unlinked lead, and applies every lead of the window', async () => {
    givenSite({ leads: [lead(), lead({ id: 'L2', crm_id: 'O2' })] });

    await run();

    expect(fetchSiteRows).toHaveBeenCalledWith(SETTINGS, 'leads', {
      updated_at: `gte.${SINCE}`,
    });
    expect(handleLeadCreated).toHaveBeenCalledTimes(1);
    expect(handleLeadCreated).toHaveBeenCalledWith(
      client,
      lead(),
      expect.anything(),
    );
    expect(handleLeadUpdated).toHaveBeenCalledTimes(2);
  });

  it('sends a status the site missed when the opportunity is ahead', async () => {
    givenSite({ leads: [lead({ crm_id: 'O1' })] });
    vi.mocked(findLeadOpportunity).mockResolvedValue({
      id: 'O1',
      name: 'X',
      interfazeStage: 'QUOTE_SENT',
      siteLeadId: 'L1',
      siteLeadStatusSeen: 'new',
      ownerId: null,
      pointOfContactId: null,
      companyId: null,
    });

    await run();

    expect(patchLead).toHaveBeenCalledWith(SETTINGS, 'L1', {
      status: 'in_progress',
    });
    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: 'O1', data: { siteLeadStatusSeen: 'in_progress' } },
    ]);
  });

  it('never sends a status back behind the site', async () => {
    givenSite({ leads: [lead({ crm_id: 'O1', status: 'done' })] });
    vi.mocked(findLeadOpportunity).mockResolvedValue({
      id: 'O1',
      name: 'X',
      interfazeStage: 'DISCUSSION',
      siteLeadId: 'L1',
      siteLeadStatusSeen: 'done',
      ownerId: null,
      pointOfContactId: null,
      companyId: null,
    });

    await run();

    expect(patchLead).not.toHaveBeenCalled();
  });

  it('purges an unsigned opportunity of more than 3 years whose lead disappeared', async () => {
    givenHubFaze({
      opportunities: () => [
        { id: 'O-old', siteLeadId: 'L-gone', requestRef: 'IFZ-231001-0001' },
        { id: 'O-kept', siteLeadId: 'L-there', requestRef: 'IFZ-231001-0002' },
      ],
    });
    givenSite({ leadsById: [{ id: 'L-there' }] });

    await run();

    expect(queryFilters(client, 'opportunities')).toContainEqual({
      siteLeadId: { is: 'NOT_NULL' },
      receivedAt: { lt: '2023-11-07T10:00:00.000Z' },
      interfazeStage: { neq: 'WON' },
    });
    expect(handleLeadDeleted).toHaveBeenCalledTimes(1);
    expect(handleLeadDeleted).toHaveBeenCalledWith(client, {
      id: 'L-gone',
      ref: 'IFZ-231001-0001',
      crm_id: 'O-old',
    });
  });
});

describe('runReconciliation · Journal de synchro', () => {
  it('purges entries older than 90 days', async () => {
    await run();

    expect(mutationArgs(client, 'deleteSyncLogs')).toEqual([
      { filter: { occurredAt: { lt: '2026-08-09T10:00:00.000Z' } } },
    ]);
  });
});
