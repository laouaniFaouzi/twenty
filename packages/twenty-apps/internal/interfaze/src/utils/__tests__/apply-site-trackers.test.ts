import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
  type QueryAnswers,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  applySitePhase,
  applySitePhaseDeleted,
  applySiteTask,
  applySiteTaskDeleted,
  applySiteTracker,
  applySiteTrackerDeleted,
} from 'src/utils/apply-site-trackers';
import {
  type TrackerRestClient,
  type TrackerSyncDependencies,
} from 'src/utils/push-trackers';
import { type SyncSettings } from 'src/utils/sync-settings';
import {
  phaseFieldsFromSite,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  syncHashOf,
  taskFieldsFromSite,
  trackerFieldsFromSite,
} from 'src/utils/tracker-mapping';

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
};

const EARLY = '2026-11-07T09:00:00.000Z';
const NOW_ISO = '2026-11-07T10:00:00.000Z';
const LATE = '2026-11-07T11:00:00.000Z';

const TRACKER: SiteTracker = {
  id: 'T1',
  client_name: 'boulangerie emile',
  offer: 'web',
  token: 'code-du-site',
  is_active: true,
  crm_id: null,
  updated_at: NOW_ISO,
};

const PHASE: SitePhase = {
  id: 'PH1',
  tracker_id: 'T1',
  name: 'On échange',
  position: 0,
  crm_id: null,
  updated_at: NOW_ISO,
};

const TASK: SiteTask = {
  id: 'TA1',
  phase_id: 'PH1',
  name: 'Atelier de cadrage',
  description: '',
  status: 'doing',
  position: 1,
  crm_id: 'TA1',
  updated_at: LATE,
};

const SYNCED_TASK_RECORD = {
  id: 'TA1',
  name: 'Atelier de cadrage',
  description: '',
  status: 'TODO',
  position: 1,
  siteId: 'TA1',
  siteUpdatedAt: NOW_ISO,
  syncHash: syncHashOf(taskFieldsFromSite({ ...TASK, status: 'todo' })),
  updatedAt: NOW_ISO,
  phaseId: 'PH1',
  projectId: 'P1',
  phase: { id: 'PH1', siteId: 'PH1' },
};

let client: MockRecordApiClient;
let rest: { [TName in keyof TrackerRestClient]: ReturnType<typeof vi.fn> };
let deps: TrackerSyncDependencies;

const given = (answers: QueryAnswers) => answerQueries(client, answers);

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(
    async (request: Record<string, unknown>) => {
      const name = Object.keys(request)[0];

      return { [name]: { id: name === 'createCompany' ? 'C-new' : 'X' } };
    },
  );
  rest = {
    insertSiteTracker: vi.fn(),
    updateSiteTracker: vi.fn(async (_settings, id, patch) => ({
      ...TRACKER,
      id,
      ...patch,
    })),
    findSiteTrackerByCrmId: vi.fn(),
    upsertSitePhase: vi.fn(),
    upsertSiteTask: vi.fn(),
    updateSiteRow: vi.fn(async (_settings, _table, id, patch) => ({
      id,
      ...patch,
      updated_at: LATE,
    })),
    deleteSiteRowByCrmId: vi.fn(),
    fetchSiteRows: vi.fn(async () => []),
  };
  deps = {
    settings: SETTINGS,
    rest: rest as unknown as TrackerRestClient,
    now: () => new Date(NOW_ISO),
    randomToken: () => 'code-de-test',
  };
});

describe('applySiteTracker', () => {
  it('creates the project of a tracker made on the site, with the tracker id', async () => {
    given({
      projects: () => [],
      companies: () => [{ id: 'C9', name: 'Boulangerie Émile' }],
    });

    await applySiteTracker(client, TRACKER, deps);

    expect(mutationArgs(client, 'createProject')).toEqual([
      {
        data: {
          id: 'T1',
          name: 'boulangerie emile · WebFaze',
          offer: 'WEB',
          status: 'IN_PROGRESS',
          companyId: 'C9',
          siteTrackerId: 'T1',
          trackerUrl: {
            primaryLinkUrl: 'https://interfaze.fr/suivi/code-du-site',
            primaryLinkLabel: 'Suivi client',
          },
          siteUpdatedAt: NOW_ISO,
          syncHash: syncHashOf(trackerFieldsFromSite(TRACKER)),
        },
      },
    ]);
    expect(rest.updateSiteTracker).toHaveBeenCalledWith(SETTINGS, 'T1', {
      crm_id: 'T1',
    });
  });

  it('creates the company as a client when none matches', async () => {
    given({ projects: () => [], companies: () => [] });

    await applySiteTracker(client, TRACKER, deps);

    expect(mutationArgs(client, 'createCompany')).toEqual([
      { data: { name: 'boulangerie emile', clientStatus: 'CLIENT' } },
    ]);
    expect(mutationArgs(client, 'createProject')[0]).toMatchObject({
      data: { companyId: 'C-new' },
    });
  });

  it('archives the project of a tracker made inactive on the site', async () => {
    const project = {
      id: 'P1',
      name: 'Boulangerie Émile · WebFaze',
      offer: 'WEB',
      status: 'IN_PROGRESS',
      siteTrackerId: 'T1',
      siteUpdatedAt: EARLY,
      syncHash: syncHashOf({
        client_name: 'Boulangerie Émile',
        offer: 'web',
        is_active: true,
      }),
      updatedAt: EARLY,
      trackerUrl: { primaryLinkUrl: 'https://interfaze.fr/suivi/code-du-site' },
      company: { name: 'Boulangerie Émile' },
    };

    given({ projects: () => [project] });

    await applySiteTracker(
      client,
      {
        ...TRACKER,
        client_name: 'Boulangerie Émile',
        is_active: false,
        crm_id: 'P1',
      },
      deps,
    );

    expect(mutationArgs(client, 'updateProject')[0]).toEqual({
      id: 'P1',
      data: {
        offer: 'WEB',
        status: 'ARCHIVED',
        siteTrackerId: 'T1',
        siteUpdatedAt: NOW_ISO,
        syncHash: syncHashOf({
          client_name: 'Boulangerie Émile',
          offer: 'web',
          is_active: false,
        }),
      },
    });
  });

  it('updates the client link when the code is regenerated on the site', async () => {
    const project = {
      id: 'P1',
      name: 'Boulangerie Émile · WebFaze',
      offer: 'WEB',
      status: 'IN_PROGRESS',
      siteTrackerId: 'T1',
      siteUpdatedAt: EARLY,
      syncHash: syncHashOf({
        client_name: 'Boulangerie Émile',
        offer: 'web',
        is_active: true,
      }),
      updatedAt: EARLY,
      trackerUrl: { primaryLinkUrl: 'https://interfaze.fr/suivi/ancien-code' },
      company: { name: 'Boulangerie Émile' },
    };

    given({ projects: () => [project] });

    await applySiteTracker(
      client,
      { ...TRACKER, client_name: 'Boulangerie Émile', crm_id: 'P1' },
      deps,
    );

    expect(mutationArgs(client, 'updateProject')[0]).toMatchObject({
      data: {
        trackerUrl: {
          primaryLinkUrl: 'https://interfaze.fr/suivi/code-du-site',
          primaryLinkLabel: 'Suivi client',
        },
      },
    });
  });

  it('archives the tracker again when HubFaze deleted its project', async () => {
    given({ projects: () => [] });

    await applySiteTracker(client, { ...TRACKER, crm_id: 'P-deleted' }, deps);

    expect(mutationNames(client)).toEqual([]);
    expect(rest.updateSiteTracker).toHaveBeenCalledWith(SETTINGS, 'T1', {
      is_active: false,
    });
  });
});

describe('applySitePhase', () => {
  it('creates the tracker first when its phase arrives before it, then the phase', async () => {
    let projectCreated = false;

    client.mutation.mockImplementation(
      async (request: Record<string, unknown>) => {
        if ('createProject' in request) {
          projectCreated = true;
        }

        return { [Object.keys(request)[0]]: { id: 'X' } };
      },
    );
    given({
      projects: () =>
        projectCreated ? [{ id: 'T1', siteTrackerId: 'T1' }] : [],
      projectPhases: () => [],
      companies: () => [],
    });
    rest.fetchSiteRows.mockResolvedValue([TRACKER]);

    await applySitePhase(client, PHASE, deps);

    expect(rest.fetchSiteRows).toHaveBeenCalledWith(SETTINGS, 'trackers', {
      id: 'eq.T1',
    });
    expect(mutationNames(client)).toEqual([
      'createCompany',
      'createProject',
      'createProjectPhase',
    ]);
    expect(mutationArgs(client, 'createProjectPhase')).toEqual([
      {
        data: {
          id: 'PH1',
          name: 'On échange',
          position: 0,
          projectId: 'T1',
          siteId: 'PH1',
          siteUpdatedAt: NOW_ISO,
          syncHash: syncHashOf(phaseFieldsFromSite(PHASE)),
        },
      },
    ]);
    expect(rest.updateSiteRow).toHaveBeenCalledWith(
      SETTINGS,
      'tracker_phases',
      'PH1',
      { crm_id: 'PH1' },
    );
  });

  it('creates nothing when the same phase is delivered a second time', async () => {
    given({
      projects: () => [{ id: 'T1', siteTrackerId: 'T1' }],
      projectPhases: () => [
        {
          id: 'PH1',
          name: 'On échange',
          position: 0,
          siteId: 'PH1',
          siteUpdatedAt: NOW_ISO,
          syncHash: syncHashOf(phaseFieldsFromSite(PHASE)),
          updatedAt: NOW_ISO,
          projectId: 'T1',
          project: { siteTrackerId: 'T1' },
        },
      ],
    });

    await applySitePhase(client, { ...PHASE, crm_id: 'PH1' }, deps);

    expect(mutationNames(client)).toEqual([]);
  });

  it('trashes the phase deleted on the site', async () => {
    given({ projectPhases: () => [{ id: 'PH1' }] });

    await applySitePhaseDeleted(client, PHASE);

    expect(mutationArgs(client, 'deleteProjectPhase')).toEqual([{ id: 'PH1' }]);
  });
});

describe('applySiteTask', () => {
  it('applies a status changed on the site, with its hash and date', async () => {
    given({ projectTasks: () => [SYNCED_TASK_RECORD] });

    await applySiteTask(client, TASK, deps);

    expect(mutationArgs(client, 'updateProjectTask')).toEqual([
      {
        id: 'TA1',
        data: {
          name: 'Atelier de cadrage',
          description: '',
          status: 'DOING',
          position: 1,
          siteId: 'TA1',
          siteUpdatedAt: LATE,
          syncHash: syncHashOf(taskFieldsFromSite(TASK)),
        },
      },
    ]);
  });

  it('ignores a change older than the last one seen', async () => {
    given({
      projectTasks: () => [{ ...SYNCED_TASK_RECORD, siteUpdatedAt: LATE }],
    });

    await applySiteTask(client, { ...TASK, updated_at: NOW_ISO }, deps);

    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('keeps a more recent HubFaze change and sends it back to the site', async () => {
    given({
      projectTasks: () => [
        {
          ...SYNCED_TASK_RECORD,
          status: 'DONE',
          updatedAt: '2026-11-07T12:00:00.000Z',
        },
      ],
      projectTask: () => ({ ...SYNCED_TASK_RECORD, status: 'DONE' }),
    });

    await applySiteTask(client, TASK, deps);

    expect(rest.updateSiteRow).toHaveBeenCalledWith(
      SETTINGS,
      'tracker_tasks',
      'TA1',
      expect.objectContaining({ status: 'done' }),
    );
    expect(mutationArgs(client, 'updateProjectTask')[0]).not.toMatchObject({
      data: { status: 'DOING' },
    });
  });

  it('applies the site when it changed after HubFaze', async () => {
    given({
      projectTasks: () => [
        { ...SYNCED_TASK_RECORD, status: 'DONE', updatedAt: EARLY },
      ],
    });

    await applySiteTask(client, TASK, deps);

    expect(mutationArgs(client, 'updateProjectTask')[0]).toMatchObject({
      data: { status: 'DOING' },
    });
    expect(rest.updateSiteRow).not.toHaveBeenCalled();
  });

  it('deletes the site row of a task HubFaze deleted, instead of creating it again', async () => {
    given({ projectTasks: () => [] });

    await applySiteTask(client, { ...TASK, crm_id: 'TA-deleted' }, deps);

    expect(mutationNames(client)).toEqual([]);
    expect(rest.deleteSiteRowByCrmId).toHaveBeenCalledWith(
      SETTINGS,
      'tracker_tasks',
      'TA-deleted',
    );
  });

  it('trashes the task deleted on the site', async () => {
    given({ projectTasks: () => [{ id: 'TA1' }] });

    await applySiteTaskDeleted(client, TASK);

    expect(mutationArgs(client, 'deleteProjectTask')).toEqual([{ id: 'TA1' }]);
  });
});

describe('applySiteTrackerDeleted', () => {
  it('archives the project and keeps its phases and tasks', async () => {
    given({ projects: () => [{ id: 'P1', siteTrackerId: 'T1' }] });

    await applySiteTrackerDeleted(client, { ...TRACKER, crm_id: 'P1' });

    expect(mutationNames(client)).toEqual(['updateProject']);
    expect(mutationArgs(client, 'updateProject')).toEqual([
      {
        id: 'P1',
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
