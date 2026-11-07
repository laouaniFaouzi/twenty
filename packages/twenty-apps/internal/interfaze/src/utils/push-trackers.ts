import { type Offer } from 'src/constants/offer';
import { type SyncEntity } from 'src/objects/sync-log.object';
import { type ProjectStatus } from 'src/objects/project.object';
import { type ProjectTaskStatus } from 'src/objects/project-task.object';
import { presentText } from 'src/utils/present-text';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';
import { recordSyncFailure } from 'src/utils/record-sync-failure';
import { isSiteRestError } from 'src/utils/supabase-rest';
import {
  deleteSiteRowByCrmId,
  fetchSiteRows,
  findSiteTrackerByCrmId,
  insertSiteTracker,
  updateSiteRow,
  updateSiteTracker,
  upsertSitePhase,
  upsertSiteTask,
} from 'src/utils/supabase-trackers';
import { readSyncSettings, type SyncSettings } from 'src/utils/sync-settings';
import {
  generateTrackerToken,
  phaseFieldsFromProjectPhase,
  phaseFieldsFromSite,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  syncHashOf,
  taskFieldsFromProjectTask,
  taskFieldsFromSite,
  trackerFieldsFromProject,
  trackerFieldsFromSite,
  trackerUrlFor,
} from 'src/utils/tracker-mapping';

export type TrackerRestClient = {
  insertSiteTracker: typeof insertSiteTracker;
  updateSiteTracker: typeof updateSiteTracker;
  findSiteTrackerByCrmId: typeof findSiteTrackerByCrmId;
  upsertSitePhase: typeof upsertSitePhase;
  upsertSiteTask: typeof upsertSiteTask;
  updateSiteRow: typeof updateSiteRow;
  deleteSiteRowByCrmId: typeof deleteSiteRowByCrmId;
  fetchSiteRows: typeof fetchSiteRows;
};

export const TRACKER_REST_CLIENT: TrackerRestClient = {
  insertSiteTracker,
  updateSiteTracker,
  findSiteTrackerByCrmId,
  upsertSitePhase,
  upsertSiteTask,
  updateSiteRow,
  deleteSiteRowByCrmId,
  fetchSiteRows,
};

export type TrackerSyncDependencies = {
  settings: SyncSettings;
  rest: TrackerRestClient;
  now: () => Date;
  randomToken: () => string;
};

export const buildTrackerSyncDependencies = (
  env: Record<string, string | undefined>,
): TrackerSyncDependencies | null => {
  const settingsResult = readSyncSettings(env);

  return settingsResult.success
    ? {
        settings: settingsResult.settings,
        rest: TRACKER_REST_CLIENT,
        now: () => new Date(),
        randomToken: () => generateTrackerToken(),
      }
    : null;
};

export type PushOptions = { force?: boolean };

export type TrackerSyncObjectName = 'project' | 'projectPhase' | 'projectTask';

export type TrackerSyncEvent = {
  objectName: TrackerSyncObjectName;
  name: string;
  recordId: string;
  properties: {
    updatedFields?: string[];
    before?: { siteTrackerId?: string | null } | null;
  };
};

type ProjectForSync = {
  id: string;
  name: string | null;
  offer: Offer | null;
  status: ProjectStatus;
  siteTrackerId: string | null;
  syncHash: string | null;
  company: { name: string | null } | null;
};

type PhaseForSync = {
  id: string;
  name: string | null;
  position: number;
  siteId: string | null;
  syncHash: string | null;
  project: { id: string; siteTrackerId: string | null } | null;
};

type TaskForSync = {
  id: string;
  name: string | null;
  description: string | null;
  status: ProjectTaskStatus | null;
  position: number;
  siteId: string | null;
  syncHash: string | null;
  phase: { id: string; siteId: string | null } | null;
};

const SYNCED_FIELDS: Record<TrackerSyncObjectName, string[]> = {
  project: ['name', 'offer', 'status', 'companyId'],
  projectPhase: ['name', 'position', 'projectId'],
  projectTask: ['name', 'description', 'status', 'position', 'phaseId'],
};

const ENTITY_BY_OBJECT: Record<TrackerSyncObjectName, SyncEntity> = {
  project: 'TRACKER',
  projectPhase: 'PHASE',
  projectTask: 'TASK',
};

const TRACKER_LINK_LABEL = 'Suivi client';

const readProject = async (
  client: RecordApiClient,
  projectId: string,
): Promise<ProjectForSync | null> => {
  const project =
    getEdgeNodes<ProjectForSync>(
      await client.query({
        projects: {
          __args: { filter: { id: { eq: projectId } }, first: 1 },
          edges: {
            node: {
              id: true,
              name: true,
              offer: true,
              status: true,
              siteTrackerId: true,
              syncHash: true,
              company: { name: true },
            },
          },
        },
      }),
      'projects',
    )[0] ?? null;

  return project === null
    ? null
    : {
        ...project,
        siteTrackerId: presentText(project.siteTrackerId),
        syncHash: presentText(project.syncHash),
      };
};

const readPhase = async (
  client: RecordApiClient,
  phaseId: string,
): Promise<PhaseForSync | null> => {
  const phase =
    getEdgeNodes<PhaseForSync>(
      await client.query({
        projectPhases: {
          __args: { filter: { id: { eq: phaseId } }, first: 1 },
          edges: {
            node: {
              id: true,
              name: true,
              position: true,
              siteId: true,
              syncHash: true,
              project: { id: true, siteTrackerId: true },
            },
          },
        },
      }),
      'projectPhases',
    )[0] ?? null;

  return phase === null
    ? null
    : {
        ...phase,
        siteId: presentText(phase.siteId),
        syncHash: presentText(phase.syncHash),
        project: !phase.project
          ? null
          : {
              ...phase.project,
              siteTrackerId: presentText(phase.project.siteTrackerId),
            },
      };
};

const readTask = async (
  client: RecordApiClient,
  taskId: string,
): Promise<TaskForSync | null> => {
  const task =
    getEdgeNodes<TaskForSync>(
      await client.query({
        projectTasks: {
          __args: { filter: { id: { eq: taskId } }, first: 1 },
          edges: {
            node: {
              id: true,
              name: true,
              description: true,
              status: true,
              position: true,
              siteId: true,
              syncHash: true,
              phase: { id: true, siteId: true },
            },
          },
        },
      }),
      'projectTasks',
    )[0] ?? null;

  return task === null
    ? null
    : {
        ...task,
        siteId: presentText(task.siteId),
        syncHash: presentText(task.syncHash),
        phase: !task.phase
          ? null
          : { ...task.phase, siteId: presentText(task.phase.siteId) },
      };
};

const updateRecord = async (
  client: RecordApiClient,
  mutationName: 'updateProject' | 'updateProjectPhase' | 'updateProjectTask',
  id: string,
  data: Record<string, unknown>,
) => {
  await client.mutation({ [mutationName]: { __args: { id, data }, id: true } });
};

const insertTracker = async (
  project: ProjectForSync,
  fields: NonNullable<ReturnType<typeof trackerFieldsFromProject>>,
  { settings, rest, randomToken }: TrackerSyncDependencies,
): Promise<SiteTracker> => {
  try {
    return await rest.insertSiteTracker(settings, {
      ...fields,
      token: randomToken(),
      crm_id: project.id,
    });
  } catch (error) {
    // Another run created it first: its code is the one to keep.
    if (isSiteRestError(error) && error.status === 409) {
      const existing = await rest.findSiteTrackerByCrmId(settings, project.id);

      if (existing !== null) {
        return existing;
      }
    }

    throw error;
  }
};

export const pushProject = async (
  client: RecordApiClient,
  projectId: string,
  deps: TrackerSyncDependencies,
  { force = false }: PushOptions = {},
): Promise<'created' | 'updated' | 'unchanged' | 'skipped'> => {
  const project = await readProject(client, projectId);
  const fields =
    project === null
      ? null
      : trackerFieldsFromProject({
          name: project.name ?? '',
          offer: project.offer,
          status: project.status,
          companyName: project.company?.name ?? null,
        });

  if (project === null || fields === null) {
    return 'skipped';
  }

  if (project.siteTrackerId === null) {
    if (project.status === 'ARCHIVED') {
      return 'skipped';
    }

    const row = await insertTracker(project, fields, deps);

    await updateRecord(client, 'updateProject', project.id, {
      siteTrackerId: row.id,
      trackerUrl: {
        primaryLinkUrl: trackerUrlFor(deps.settings.siteUrl, row.token),
        primaryLinkLabel: TRACKER_LINK_LABEL,
      },
      siteUpdatedAt: row.updated_at,
      syncHash: syncHashOf(trackerFieldsFromSite(row)),
    });

    return 'created';
  }

  if (!force && syncHashOf(fields) === project.syncHash) {
    return 'unchanged';
  }

  const row = await deps.rest.updateSiteTracker(
    deps.settings,
    project.siteTrackerId,
    fields,
  );

  if (row === null) {
    // The tracker was deleted on the site: the project follows, as for a deletion received from the site.
    await unlinkProjectFromSite(client, project.id);

    return 'updated';
  }

  await updateRecord(client, 'updateProject', project.id, {
    siteUpdatedAt: row.updated_at,
    syncHash: syncHashOf(trackerFieldsFromSite(row)),
  });

  return 'updated';
};

export const pushPhase = async (
  client: RecordApiClient,
  phaseId: string,
  deps: TrackerSyncDependencies,
  { force = false }: PushOptions = {},
): Promise<'pushed' | 'unchanged' | 'skipped'> => {
  const phase = await readPhase(client, phaseId);
  const trackerSiteId = phase?.project?.siteTrackerId ?? null;

  if (phase === null || trackerSiteId === null) {
    return 'skipped';
  }

  const fields = phaseFieldsFromProjectPhase(phase, trackerSiteId);

  if (
    !force &&
    phase.siteId !== null &&
    syncHashOf(fields) === phase.syncHash
  ) {
    return 'unchanged';
  }

  // A known site row is updated by its id, so a row deleted on the site is not created again.
  const row =
    !force && phase.siteId !== null
      ? await deps.rest.updateSiteRow<SitePhase>(
          deps.settings,
          'tracker_phases',
          phase.siteId,
          fields,
        )
      : await deps.rest.upsertSitePhase(deps.settings, {
          ...fields,
          crm_id: phase.id,
        });

  if (row === null) {
    return 'skipped';
  }

  await updateRecord(client, 'updateProjectPhase', phase.id, {
    siteId: row.id,
    siteUpdatedAt: row.updated_at,
    syncHash: syncHashOf(phaseFieldsFromSite(row)),
  });

  return 'pushed';
};

export const pushTask = async (
  client: RecordApiClient,
  taskId: string,
  deps: TrackerSyncDependencies,
  { force = false }: PushOptions = {},
): Promise<'pushed' | 'unchanged' | 'skipped'> => {
  const task = await readTask(client, taskId);
  const phaseSiteId = task?.phase?.siteId ?? null;

  if (task === null || phaseSiteId === null) {
    return 'skipped';
  }

  const fields = taskFieldsFromProjectTask(task, phaseSiteId);

  if (!force && task.siteId !== null && syncHashOf(fields) === task.syncHash) {
    return 'unchanged';
  }

  const row =
    !force && task.siteId !== null
      ? await deps.rest.updateSiteRow<SiteTask>(
          deps.settings,
          'tracker_tasks',
          task.siteId,
          fields,
        )
      : await deps.rest.upsertSiteTask(deps.settings, {
          ...fields,
          crm_id: task.id,
        });

  if (row === null) {
    return 'skipped';
  }

  await updateRecord(client, 'updateProjectTask', task.id, {
    siteId: row.id,
    siteUpdatedAt: row.updated_at,
    syncHash: syncHashOf(taskFieldsFromSite(row)),
  });

  return 'pushed';
};

const CLEARED_SYNC_FIELDS = {
  siteId: null,
  siteUpdatedAt: null,
  syncHash: null,
};

// The rows of a deleted tracker or phase are gone from the site: forgetting their ids sends them again
// if the project or the phase comes back, instead of updating rows that no longer exist.
export const unlinkProjectFromSite = async (
  client: RecordApiClient,
  projectId: string,
): Promise<void> => {
  await updateRecord(client, 'updateProject', projectId, {
    status: 'ARCHIVED',
    siteTrackerId: null,
    siteUpdatedAt: null,
    syncHash: null,
  });

  for (const mutationName of ['updateProjectPhases', 'updateProjectTasks']) {
    await client.mutation({
      [mutationName]: {
        __args: {
          filter: { projectId: { eq: projectId } },
          data: CLEARED_SYNC_FIELDS,
        },
        id: true,
      },
    });
  }
};

const pushRecords = async (
  client: RecordApiClient,
  root: 'projectPhases' | 'projectTasks',
  filter: Record<string, unknown>,
  push: (id: string) => Promise<unknown>,
) => {
  const response = await client.query({
    [root]: { __args: { filter, first: 200 }, edges: { node: { id: true } } },
  });

  for (const { id } of getEdgeNodes<{ id: string }>(response, root)) {
    await push(id);
  }
};

export const pushProjectChildren = async (
  client: RecordApiClient,
  projectId: string,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  const byProject = { projectId: { eq: projectId } };

  await pushRecords(client, 'projectPhases', byProject, (id) =>
    pushPhase(client, id, deps),
  );
  await pushRecords(client, 'projectTasks', byProject, (id) =>
    pushTask(client, id, deps),
  );
};

// Tasks created or restored before their phase reached the site were skipped: they follow it.
const pushWaitingTasksOfPhase = (
  client: RecordApiClient,
  phaseId: string,
  deps: TrackerSyncDependencies,
) =>
  pushRecords(
    client,
    'projectTasks',
    {
      phaseId: { eq: phaseId },
      or: [{ siteId: { is: 'NULL' } }, { siteId: { eq: '' } }],
    },
    (id) => pushTask(client, id, deps),
  );

export const pushProjectTree = async (
  client: RecordApiClient,
  projectId: string,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  await pushProject(client, projectId, deps);
  await pushProjectChildren(client, projectId, deps);
};

export const deleteSitePhase = (
  phaseId: string,
  deps: TrackerSyncDependencies,
) => deps.rest.deleteSiteRowByCrmId(deps.settings, 'tracker_phases', phaseId);

export const deleteSiteTask = (taskId: string, deps: TrackerSyncDependencies) =>
  deps.rest.deleteSiteRowByCrmId(deps.settings, 'tracker_tasks', taskId);

// A deleted project can no longer be read: its tracker id comes from the event.
export const archiveSiteTracker = async (
  siteTrackerId: string | null,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  if (siteTrackerId) {
    await deps.rest.updateSiteTracker(deps.settings, siteTrackerId, {
      is_active: false,
    });
  }
};

const runSyncEvent = async (
  client: RecordApiClient,
  { objectName, name, recordId, properties }: TrackerSyncEvent,
  deps: TrackerSyncDependencies,
) => {
  const operation = name.split('.')[1];

  if (operation === 'deleted') {
    if (objectName === 'project') {
      await archiveSiteTracker(properties.before?.siteTrackerId ?? null, deps);
    } else if (objectName === 'projectPhase') {
      await deleteSitePhase(recordId, deps);
    } else {
      await deleteSiteTask(recordId, deps);
    }

    return;
  }

  const force = operation === 'restored';

  if (objectName === 'project') {
    const isNewTree =
      operation === 'created' ||
      (properties.updatedFields ?? []).includes('offer');

    if (isNewTree) {
      await pushProjectTree(client, recordId, deps);
    } else if (
      (await pushProject(client, recordId, deps, { force })) === 'created'
    ) {
      // A project back from the archive gets a new tracker: its checklist goes with it.
      await pushProjectChildren(client, recordId, deps);
    }
  } else if (objectName === 'projectPhase') {
    if (force) {
      // Restored tasks must wait for the phase's new site id, not use the deleted one.
      await updateRecord(
        client,
        'updateProjectPhase',
        recordId,
        CLEARED_SYNC_FIELDS,
      );
      await client.mutation({
        updateProjectTasks: {
          __args: {
            filter: { phaseId: { eq: recordId } },
            data: CLEARED_SYNC_FIELDS,
          },
          id: true,
        },
      });
    }

    if ((await pushPhase(client, recordId, deps, { force })) === 'pushed') {
      await pushWaitingTasksOfPhase(client, recordId, deps);
    }
  } else {
    await pushTask(client, recordId, deps, { force });
  }
};

const SYNCED_OPERATIONS = ['created', 'updated', 'deleted', 'restored'];

export const handleTrackerSyncEvent = async (
  client: RecordApiClient,
  event: TrackerSyncEvent,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  const operation = event.name.split('.')[1];

  // A destroyed record left the trash: its deletion already reached the site.
  if (!SYNCED_OPERATIONS.includes(operation)) {
    return;
  }

  if (
    operation === 'updated' &&
    !(event.properties.updatedFields ?? []).some((field) =>
      SYNCED_FIELDS[event.objectName].includes(field),
    )
  ) {
    return;
  }

  try {
    await runSyncEvent(client, event, deps);
  } catch (error) {
    await recordSyncFailure(
      client,
      {
        direction: 'CRM_TO_SITE',
        entity: ENTITY_BY_OBJECT[event.objectName],
        siteId: null,
        recordId: event.recordId,
        error,
      },
      deps.now(),
    );
  }
};
