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
  buildTrackerSyncDependencies,
  handleTrackerSyncEvent,
  pushProjectTree,
  TRACKER_REST_CLIENT,
  type TrackerRestClient,
  type TrackerSyncDependencies,
} from 'src/utils/push-trackers';
import { type SyncSettings } from 'src/utils/sync-settings';
import {
  phaseFieldsFromProjectPhase,
  syncHashOf,
  taskFieldsFromProjectTask,
  trackerFieldsFromProject,
} from 'src/utils/tracker-mapping';

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
};

const NOW = new Date('2026-11-07T10:00:00.000Z');
const SITE_UPDATED_AT = '2026-11-07T10:00:01.000Z';

const PROJECT = {
  id: 'P1',
  name: 'Boulangerie Martin · WebFaze',
  offer: 'WEB',
  status: 'IN_PROGRESS',
  siteTrackerId: null as string | null,
  syncHash: null as string | null,
  company: { name: 'Boulangerie Martin' },
};

const SYNCED_PROJECT = {
  ...PROJECT,
  siteTrackerId: 'S-T1',
  syncHash: syncHashOf(
    trackerFieldsFromProject({
      name: PROJECT.name,
      offer: 'WEB',
      status: 'IN_PROGRESS',
      companyName: 'Boulangerie Martin',
    }) ?? {},
  ),
};

const PHASE = {
  id: 'PH1',
  name: 'On échange',
  position: 0,
  siteId: null as string | null,
  syncHash: null as string | null,
  project: { id: 'P1', siteTrackerId: 'S-T1' },
};

const TASK = {
  id: 'TA1',
  name: 'Atelier de cadrage',
  description: null,
  status: 'TODO',
  position: 1.5,
  siteId: null as string | null,
  syncHash: null as string | null,
  phase: { id: 'PH1', siteId: 'S-PH1' },
};

const siteRow = (id: string, fields: Record<string, unknown>) => ({
  id,
  ...fields,
  crm_id: null,
  updated_at: SITE_UPDATED_AT,
});

let client: MockRecordApiClient;
let rest: { [TName in keyof TrackerRestClient]: ReturnType<typeof vi.fn> };
let deps: TrackerSyncDependencies;

const given = (answers: QueryAnswers) => answerQueries(client, answers);

beforeEach(() => {
  client = createMockRecordApiClient();
  client.mutation.mockImplementation(
    async (request: Record<string, unknown>) => ({
      [Object.keys(request)[0]]: { id: 'X' },
    }),
  );
  rest = {
    insertSiteTracker: vi.fn(async (_settings, fields) =>
      siteRow('S-T1', { ...fields, token: 'code-de-test' }),
    ),
    updateSiteTracker: vi.fn(async (_settings, id, patch) =>
      siteRow(id, {
        client_name: 'Boulangerie Martin',
        offer: 'web',
        is_active: true,
        token: 'code-de-test',
        ...patch,
      }),
    ),
    findSiteTrackerByCrmId: vi.fn(async () =>
      siteRow('S-T1', {
        client_name: 'Boulangerie Martin',
        offer: 'web',
        is_active: true,
        token: 'code-existant',
      }),
    ),
    upsertSitePhase: vi.fn(async (_settings, fields) =>
      siteRow('S-PH1', fields),
    ),
    upsertSiteTask: vi.fn(async (_settings, fields) =>
      siteRow('S-TA1', fields),
    ),
    updateSiteRow: vi.fn(async (_settings, _table, id, fields) =>
      siteRow(id, fields),
    ),
    deleteSiteRowByCrmId: vi.fn(async () => undefined),
    fetchSiteRows: vi.fn(async () => []),
  };
  deps = {
    settings: SETTINGS,
    rest: rest as unknown as TrackerRestClient,
    now: () => NOW,
    randomToken: () => 'code-de-test',
  };
});

const projectEvent = (name: string, properties: Record<string, unknown> = {}) =>
  handleTrackerSyncEvent(
    client,
    {
      objectName: 'project',
      name: `project.${name}`,
      recordId: 'P1',
      properties,
    },
    deps,
  );

const phaseEvent = (name: string, properties: Record<string, unknown> = {}) =>
  handleTrackerSyncEvent(
    client,
    {
      objectName: 'projectPhase',
      name: `projectPhase.${name}`,
      recordId: 'PH1',
      properties,
    },
    deps,
  );

const taskEvent = (name: string, properties: Record<string, unknown> = {}) =>
  handleTrackerSyncEvent(
    client,
    {
      objectName: 'projectTask',
      name: `projectTask.${name}`,
      recordId: 'TA1',
      properties,
    },
    deps,
  );

describe('project to tracker', () => {
  it('creates the tracker of a new project with an offer, then records the link', async () => {
    given({ projects: () => [PROJECT] });

    await projectEvent('updated', { updatedFields: ['companyId'] });

    expect(rest.insertSiteTracker).toHaveBeenCalledWith(SETTINGS, {
      client_name: 'Boulangerie Martin',
      offer: 'web',
      is_active: true,
      token: 'code-de-test',
      crm_id: 'P1',
    });
    expect(mutationArgs(client, 'updateProject')).toEqual([
      {
        id: 'P1',
        data: {
          siteTrackerId: 'S-T1',
          trackerUrl: {
            primaryLinkUrl: 'https://interfaze.fr/suivi/code-de-test',
            primaryLinkLabel: 'Suivi client',
          },
          siteUpdatedAt: SITE_UPDATED_AT,
          syncHash: SYNCED_PROJECT.syncHash,
        },
      },
    ]);
  });

  it('reads an empty text field as no tracker yet, as Twenty stores it', async () => {
    given({
      projects: () => [{ ...PROJECT, siteTrackerId: '', syncHash: '' }],
    });

    await projectEvent('updated', { updatedFields: ['name'] });

    expect(rest.insertSiteTracker).toHaveBeenCalledTimes(1);
    expect(rest.updateSiteTracker).not.toHaveBeenCalled();
  });

  it('reads the tracker another run already created instead of inserting it twice', async () => {
    given({ projects: () => [PROJECT] });
    rest.insertSiteTracker.mockRejectedValue(
      Object.assign(new Error('Supabase a refusé POST trackers (409)'), {
        status: 409,
      }),
    );

    await projectEvent('updated', { updatedFields: ['name'] });

    expect(rest.insertSiteTracker).toHaveBeenCalledTimes(1);
    expect(rest.findSiteTrackerByCrmId).toHaveBeenCalledWith(SETTINGS, 'P1');
    expect(mutationArgs(client, 'updateProject')[0]).toMatchObject({
      data: {
        trackerUrl: {
          primaryLinkUrl: 'https://interfaze.fr/suivi/code-existant',
        },
      },
    });
  });

  it.each([
    ['without an offer', { ...PROJECT, offer: null }],
    ['archived and never sent', { ...PROJECT, status: 'ARCHIVED' }],
  ])('sends nothing for a project %s', async (_, project) => {
    given({ projects: () => [project] });

    await projectEvent('updated', { updatedFields: ['status'] });

    expect(rest.insertSiteTracker).not.toHaveBeenCalled();
    expect(rest.updateSiteTracker).not.toHaveBeenCalled();
  });

  it('sends a new company name to the tracker', async () => {
    given({
      projects: () => [
        {
          ...SYNCED_PROJECT,
          company: { name: 'Martin & Fils' },
        },
      ],
    });

    await projectEvent('updated', { updatedFields: ['companyId'] });

    expect(rest.updateSiteTracker).toHaveBeenCalledWith(SETTINGS, 'S-T1', {
      client_name: 'Martin & Fils',
      offer: 'web',
      is_active: true,
    });
    expect(mutationArgs(client, 'updateProject')[0]).toMatchObject({
      data: { siteUpdatedAt: SITE_UPDATED_AT },
    });
  });

  it('sends nothing back for a write that came from the site', async () => {
    given({ projects: () => [SYNCED_PROJECT] });

    await projectEvent('updated', { updatedFields: ['status'] });

    expect(rest.updateSiteTracker).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('only archives the tracker of a deleted project', async () => {
    await projectEvent('deleted', { before: { siteTrackerId: 'S-T1' } });

    expect(rest.updateSiteTracker).toHaveBeenCalledWith(SETTINGS, 'S-T1', {
      is_active: false,
    });
    expect(rest.deleteSiteRowByCrmId).not.toHaveBeenCalled();
  });

  it('archives the project when its tracker is gone from the site, forgetting the site ids of its phases and tasks', async () => {
    given({
      projects: () => [
        { ...SYNCED_PROJECT, name: 'Nouveau nom', company: null },
      ],
    });
    rest.updateSiteTracker.mockResolvedValue(null);

    await projectEvent('updated', { updatedFields: ['name'] });

    expect(mutationNames(client)).toEqual([
      'updateProject',
      'updateProjectPhases',
      'updateProjectTasks',
    ]);
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
    expect(mutationArgs(client, 'updateProjectPhases')).toEqual([
      {
        filter: { projectId: { eq: 'P1' } },
        data: { siteId: null, siteUpdatedAt: null, syncHash: null },
      },
    ]);
    expect(mutationArgs(client, 'updateProjectTasks')).toEqual([
      {
        filter: { projectId: { eq: 'P1' } },
        data: { siteId: null, siteUpdatedAt: null, syncHash: null },
      },
    ]);
  });

  it('sends the whole checklist with the new tracker of a project taken out of the archive', async () => {
    given({
      projects: () => [{ ...PROJECT, siteTrackerId: '', syncHash: '' }],
      projectPhases: () => [PHASE],
      projectTasks: () => [{ ...TASK, siteId: '' }],
    });

    await projectEvent('updated', { updatedFields: ['status'] });

    expect(rest.insertSiteTracker).toHaveBeenCalledTimes(1);
    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);
    expect(rest.upsertSiteTask).toHaveBeenCalledTimes(1);
  });

  it('sends a restored project even though its hash did not move', async () => {
    given({ projects: () => [SYNCED_PROJECT] });

    await projectEvent('restored');

    expect(rest.updateSiteTracker).toHaveBeenCalledWith(SETTINGS, 'S-T1', {
      client_name: 'Boulangerie Martin',
      offer: 'web',
      is_active: true,
    });
  });
});

describe('phases and tasks to the site', () => {
  it('creates a new phase on its HubFaze id and records its site id', async () => {
    given({ projectPhases: () => [PHASE] });

    await phaseEvent('created');

    expect(rest.upsertSitePhase).toHaveBeenCalledWith(SETTINGS, {
      tracker_id: 'S-T1',
      name: 'On échange',
      position: 0,
      crm_id: 'PH1',
    });
    expect(mutationArgs(client, 'updateProjectPhase')).toEqual([
      {
        id: 'PH1',
        data: {
          siteId: 'S-PH1',
          siteUpdatedAt: SITE_UPDATED_AT,
          syncHash: syncHashOf(phaseFieldsFromProjectPhase(PHASE, 'S-T1')),
        },
      },
    ]);
  });

  it('creates a phase whose site id is an empty text, and skips one whose tracker id is empty', async () => {
    given({ projectPhases: () => [{ ...PHASE, siteId: '', syncHash: '' }] });

    await phaseEvent('created');

    expect(rest.updateSiteRow).not.toHaveBeenCalled();
    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);

    given({
      projectPhases: () => [
        {
          ...PHASE,
          project: { id: 'P1', siteTrackerId: '' },
        },
      ],
    });

    await phaseEvent('created');

    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);
  });

  it('updates a phase the site already knows by its site id', async () => {
    given({
      projectPhases: () => [
        {
          ...PHASE,
          siteId: 'S-PH1',
          name: 'On échange (bis)',
        },
      ],
    });

    await phaseEvent('updated', { updatedFields: ['name'] });

    expect(rest.updateSiteRow).toHaveBeenCalledWith(
      SETTINGS,
      'tracker_phases',
      'S-PH1',
      {
        tracker_id: 'S-T1',
        name: 'On échange (bis)',
        position: 0,
      },
    );
    expect(rest.upsertSitePhase).not.toHaveBeenCalled();
  });

  it('leaves a phase whose tracker is not on the site yet', async () => {
    given({
      projectPhases: () => [
        {
          ...PHASE,
          project: { id: 'P1', siteTrackerId: null },
        },
      ],
    });

    await phaseEvent('created');

    expect(rest.upsertSitePhase).not.toHaveBeenCalled();
  });

  it('leaves a task whose phase is not on the site yet, without failing', async () => {
    given({
      projectTasks: () => [{ ...TASK, phase: { id: 'PH1', siteId: null } }],
    });

    await taskEvent('created');

    expect(rest.upsertSiteTask).not.toHaveBeenCalled();
    expect(mutationNames(client)).not.toContain('createSyncLog');
  });

  it('upserts a task delivered twice on the same HubFaze id', async () => {
    given({ projectTasks: () => [TASK] });

    await taskEvent('created');
    await taskEvent('created');

    expect(rest.upsertSiteTask).toHaveBeenCalledTimes(2);
    expect(
      rest.upsertSiteTask.mock.calls.map(([, fields]) => fields.crm_id),
    ).toEqual(['TA1', 'TA1']);
  });

  it('sends a checked task, keeping its decimal position', async () => {
    given({
      projectTasks: () => [{ ...TASK, siteId: 'S-TA1', status: 'DONE' }],
    });

    await taskEvent('updated', { updatedFields: ['status'] });

    expect(rest.updateSiteRow).toHaveBeenCalledWith(
      SETTINGS,
      'tracker_tasks',
      'S-TA1',
      {
        phase_id: 'S-PH1',
        name: 'Atelier de cadrage',
        description: '',
        status: 'done',
        position: 1.5,
      },
    );
  });

  it('sends nothing for a task whose synced fields did not change', async () => {
    given({
      projectTasks: () => [
        {
          ...TASK,
          siteId: 'S-TA1',
          syncHash: syncHashOf(
            taskFieldsFromProjectTask({ ...TASK, status: 'TODO' }, 'S-PH1'),
          ),
        },
      ],
    });

    await taskEvent('updated', { updatedFields: ['status'] });

    expect(rest.updateSiteRow).not.toHaveBeenCalled();
  });

  it('never sends internal fields', async () => {
    given({ projectTasks: () => [{ ...TASK, siteId: 'S-TA1' }] });

    await taskEvent('updated', {
      updatedFields: ['assigneeId', 'dueDate', 'siteUpdatedAt', 'syncHash'],
    });

    expect(client.query).not.toHaveBeenCalled();
    expect(rest.updateSiteRow).not.toHaveBeenCalled();
  });

  it('skips a record deleted before its event is processed, without noting a failure', async () => {
    given({
      projects: () => [],
      projectPhases: () => [],
      projectTasks: () => [],
    });

    await projectEvent('updated', { updatedFields: ['name'] });
    await phaseEvent('updated', { updatedFields: ['name'] });
    await taskEvent('updated', { updatedFields: ['name'] });

    expect(mutationNames(client)).toEqual([]);
    expect(rest.updateSiteTracker).not.toHaveBeenCalled();
  });

  it('ignores records destroyed for good, which no longer exist on either side', async () => {
    await projectEvent('destroyed');
    await phaseEvent('destroyed');
    await taskEvent('destroyed');

    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
    expect(rest.deleteSiteRowByCrmId).not.toHaveBeenCalled();
  });

  it('deletes a phase and a task on the site by their HubFaze id', async () => {
    await phaseEvent('deleted');
    await taskEvent('deleted');

    expect(rest.deleteSiteRowByCrmId.mock.calls).toEqual([
      [SETTINGS, 'tracker_phases', 'PH1'],
      [SETTINGS, 'tracker_tasks', 'TA1'],
    ]);
  });

  it('creates a restored phase again, then its restored tasks, never with the old site ids', async () => {
    given({
      projectPhases: () => [{ ...PHASE, siteId: 'S-OLD' }],
      projectTasks: () => [{ ...TASK, siteId: '' }],
    });

    await phaseEvent('restored');

    expect(mutationNames(client).slice(0, 2)).toEqual([
      'updateProjectPhase',
      'updateProjectTasks',
    ]);
    expect(mutationArgs(client, 'updateProjectPhase')[0]).toEqual({
      id: 'PH1',
      data: { siteId: null, siteUpdatedAt: null, syncHash: null },
    });
    expect(mutationArgs(client, 'updateProjectTasks')[0]).toEqual({
      filter: { phaseId: { eq: 'PH1' } },
      data: { siteId: null, siteUpdatedAt: null, syncHash: null },
    });
    expect(rest.updateSiteRow).not.toHaveBeenCalled();
    expect(rest.upsertSitePhase).toHaveBeenCalledWith(
      SETTINGS,
      expect.objectContaining({ crm_id: 'PH1' }),
    );
    expect(rest.upsertSiteTask).toHaveBeenCalledWith(
      SETTINGS,
      expect.objectContaining({ crm_id: 'TA1' }),
    );
  });

  it('sends the tasks waiting for a new phase as soon as the phase reaches the site', async () => {
    given({
      projectPhases: () => [PHASE],
      projectTasks: () => [{ ...TASK, siteId: '' }],
    });

    await phaseEvent('created');

    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);
    expect(rest.upsertSiteTask).toHaveBeenCalledTimes(1);
  });

  it('notes a failed call in the Journal de synchro without throwing', async () => {
    given({
      projectTasks: () => [{ ...TASK, siteId: 'S-TA1', status: 'DONE' }],
    });
    rest.updateSiteRow.mockRejectedValue(
      new Error('Supabase a refusé PATCH tracker_tasks (500)'),
    );

    await expect(
      taskEvent('updated', { updatedFields: ['status'] }),
    ).resolves.toBeUndefined();

    expect(mutationArgs(client, 'createSyncLog')).toEqual([
      {
        data: expect.objectContaining({
          direction: 'CRM_TO_SITE',
          entity: 'TASK',
          recordId: 'TA1',
          error: 'Supabase a refusé PATCH tracker_tasks (500)',
        }),
      },
    ]);
  });
});

describe('pushProjectTree', () => {
  it('sends the tracker, then every phase, then every task', async () => {
    given({
      projects: () => [SYNCED_PROJECT],
      projectPhases: () => [PHASE],
      projectTasks: () => [TASK],
    });

    await pushProjectTree(client, 'P1', deps);

    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);
    expect(rest.upsertSiteTask).toHaveBeenCalledTimes(1);
    expect(rest.upsertSitePhase.mock.invocationCallOrder[0]).toBeLessThan(
      rest.upsertSiteTask.mock.invocationCallOrder[0],
    );
  });

  it('sends the whole tree of a project that receives its offer', async () => {
    given({
      projects: () => [SYNCED_PROJECT],
      projectPhases: () => [PHASE],
      projectTasks: () => [],
    });

    await projectEvent('updated', { updatedFields: ['offer'] });

    expect(rest.upsertSitePhase).toHaveBeenCalledTimes(1);
  });
});

describe('buildTrackerSyncDependencies', () => {
  it('turns the sync off while the variables are missing', () => {
    expect(buildTrackerSyncDependencies({})).toBeNull();
  });

  it('wires the real Supabase client and a fresh tracker code', () => {
    const built = buildTrackerSyncDependencies({
      SUPABASE_URL: 'https://abc.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_xyz',
      HUBFAZE_WEBHOOK_SECRET: 'webhook-secret',
    });

    expect(built?.settings.siteUrl).toBe('https://interfaze.fr');
    expect(built?.rest).toBe(TRACKER_REST_CLIENT);
    expect(built?.randomToken()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(built?.now()).toBeInstanceOf(Date);
  });
});
