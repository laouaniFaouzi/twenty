import { type Offer, OFFER_LABELS } from 'src/constants/offer';
import { type ProjectStatus } from 'src/objects/project.object';
import { type ProjectTaskStatus } from 'src/objects/project-task.object';
import { findOrCreateCompany } from 'src/utils/handle-lead-created';
import {
  pushPhase,
  pushProject,
  pushTask,
  type TrackerSyncDependencies,
} from 'src/utils/push-trackers';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';
import {
  decideMerge,
  isLateSiteChange,
  phaseDataFromSite,
  phaseFieldsFromProjectPhase,
  phaseFieldsFromSite,
  projectDataFromTracker,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  syncHashOf,
  taskDataFromSite,
  taskFieldsFromProjectTask,
  taskFieldsFromSite,
  tokenFromTrackerUrl,
  trackerFieldsFromProject,
  trackerFieldsFromSite,
  trackerUrlFor,
} from 'src/utils/tracker-mapping';

type ProjectRecord = {
  id: string;
  name: string | null;
  offer: Offer | null;
  status: ProjectStatus;
  siteTrackerId: string | null;
  siteUpdatedAt: string | null;
  syncHash: string | null;
  updatedAt: string;
  trackerUrl: { primaryLinkUrl: string | null } | null;
  company: { name: string | null } | null;
};

type PhaseRecord = {
  id: string;
  name: string | null;
  position: number;
  siteId: string | null;
  siteUpdatedAt: string | null;
  syncHash: string | null;
  updatedAt: string;
  projectId: string | null;
  project: { siteTrackerId: string | null } | null;
};

type TaskRecord = {
  id: string;
  name: string | null;
  description: string | null;
  status: ProjectTaskStatus | null;
  position: number;
  siteId: string | null;
  siteUpdatedAt: string | null;
  syncHash: string | null;
  updatedAt: string;
  phaseId: string | null;
  projectId: string | null;
  phase: { id: string; siteId: string | null } | null;
};

const TRACKER_LINK_LABEL = 'Suivi client';

const ARCHIVED_AND_UNLINKED = {
  status: 'ARCHIVED',
  siteTrackerId: null,
  siteUpdatedAt: null,
  syncHash: null,
};

// HubFaze records born on the site carry the site id as their own id.
const matchingIds = (row: { id: string; crm_id: string | null }) =>
  row.crm_id === null || row.crm_id === row.id
    ? [row.id]
    : [row.crm_id, row.id];

const pickRecord = <TRecord extends { id: string }>(
  records: TRecord[],
  row: { crm_id: string | null },
): TRecord | null =>
  records.find((record) => record.id === row.crm_id) ?? records[0] ?? null;

const findProject = async (
  client: RecordApiClient,
  row: { id: string; crm_id: string | null },
): Promise<ProjectRecord | null> => {
  const response = await client.query({
    projects: {
      __args: {
        filter: {
          or: [
            ...matchingIds(row).map((id) => ({ id: { eq: id } })),
            { siteTrackerId: { eq: row.id } },
          ],
        },
        first: 3,
      },
      edges: {
        node: {
          id: true,
          name: true,
          offer: true,
          status: true,
          siteTrackerId: true,
          siteUpdatedAt: true,
          syncHash: true,
          updatedAt: true,
          trackerUrl: { primaryLinkUrl: true },
          company: { name: true },
        },
      },
    },
  });

  return pickRecord(getEdgeNodes<ProjectRecord>(response, 'projects'), row);
};

const findPhase = async (
  client: RecordApiClient,
  row: { id: string; crm_id: string | null },
): Promise<PhaseRecord | null> => {
  const response = await client.query({
    projectPhases: {
      __args: {
        filter: {
          or: [
            ...matchingIds(row).map((id) => ({ id: { eq: id } })),
            { siteId: { eq: row.id } },
          ],
        },
        first: 3,
      },
      edges: {
        node: {
          id: true,
          name: true,
          position: true,
          siteId: true,
          siteUpdatedAt: true,
          syncHash: true,
          updatedAt: true,
          projectId: true,
          project: { siteTrackerId: true },
        },
      },
    },
  });

  return pickRecord(getEdgeNodes<PhaseRecord>(response, 'projectPhases'), row);
};

const findTask = async (
  client: RecordApiClient,
  row: { id: string; crm_id: string | null },
): Promise<TaskRecord | null> => {
  const response = await client.query({
    projectTasks: {
      __args: {
        filter: {
          or: [
            ...matchingIds(row).map((id) => ({ id: { eq: id } })),
            { siteId: { eq: row.id } },
          ],
        },
        first: 3,
      },
      edges: {
        node: {
          id: true,
          name: true,
          description: true,
          status: true,
          position: true,
          siteId: true,
          siteUpdatedAt: true,
          syncHash: true,
          updatedAt: true,
          phaseId: true,
          projectId: true,
          phase: { id: true, siteId: true },
        },
      },
    },
  });

  return pickRecord(getEdgeNodes<TaskRecord>(response, 'projectTasks'), row);
};

const updateRecord = async (
  client: RecordApiClient,
  mutationName: string,
  id: string,
  data: Record<string, unknown>,
) => {
  await client.mutation({ [mutationName]: { __args: { id, data }, id: true } });
};

// Two deliveries can race to create the same record: the loser finds the winner's.
const createOnce = async <TRecord>(
  create: () => Promise<unknown>,
  findExisting: () => Promise<TRecord | null>,
): Promise<TRecord | null> => {
  try {
    await create();

    return null;
  } catch (error) {
    const existing = await findExisting();

    if (existing === null) {
      throw error;
    }

    return existing;
  }
};

const trackerLink = (siteUrl: string, token: string) => ({
  primaryLinkUrl: trackerUrlFor(siteUrl, token),
  primaryLinkLabel: TRACKER_LINK_LABEL,
});

const localTrackerHash = (project: ProjectRecord, status = project.status) => {
  const fields = trackerFieldsFromProject({
    name: project.name ?? '',
    offer: project.offer,
    status,
    companyName: project.company?.name ?? null,
  });

  return fields === null ? '' : syncHashOf(fields);
};

const createProjectFromTracker = async (
  client: RecordApiClient,
  row: SiteTracker,
  deps: TrackerSyncDependencies,
) => {
  const company = await findOrCreateCompany(client, row.client_name, 'CLIENT');
  const { offer, status } = projectDataFromTracker(row, null);

  const existing = await createOnce(
    () =>
      client.mutation({
        createProject: {
          __args: {
            data: {
              id: row.id,
              name: `${row.client_name.trim()} · ${offer === null ? 'Suivi' : OFFER_LABELS[offer]}`,
              offer,
              status,
              companyId: company.id,
              siteTrackerId: row.id,
              trackerUrl: trackerLink(deps.settings.siteUrl, row.token),
              siteUpdatedAt: row.updated_at,
              syncHash: syncHashOf(trackerFieldsFromSite(row)),
            },
          },
          id: true,
        },
      }),
    () => findProject(client, row),
  );

  if (existing !== null) {
    await applyToExistingProject(client, row, existing, deps);

    return;
  }

  await deps.rest.updateSiteTracker(deps.settings, row.id, { crm_id: row.id });
};

const applyToExistingProject = async (
  client: RecordApiClient,
  row: SiteTracker,
  project: ProjectRecord,
  deps: TrackerSyncDependencies,
) => {
  if (isLateSiteChange(row.updated_at, project.siteUpdatedAt)) {
    return;
  }

  const siteHash = syncHashOf(trackerFieldsFromSite(row));
  const linkChange =
    tokenFromTrackerUrl(project.trackerUrl?.primaryLinkUrl ?? null) ===
    row.token
      ? {}
      : { trackerUrl: trackerLink(deps.settings.siteUrl, row.token) };
  const decision = decideMerge({
    siteHash,
    localHash: localTrackerHash(project),
    syncHash: project.syncHash,
    siteUpdatedAt: row.updated_at,
    localUpdatedAt: project.updatedAt,
  });

  if (decision === 'push_local') {
    if ('trackerUrl' in linkChange) {
      await updateRecord(client, 'updateProject', project.id, linkChange);
    }

    await pushProject(client, project.id, deps);
  } else if (decision === 'apply_site') {
    const { offer, status } = projectDataFromTracker(row, project.status);
    const offerAfter = offer ?? project.offer;

    await updateRecord(client, 'updateProject', project.id, {
      offer: offerAfter,
      status,
      ...linkChange,
      siteTrackerId: row.id,
      siteUpdatedAt: row.updated_at,
      syncHash: siteHash,
    });

    // The company stays the reference for client_name: a name typed on the site is sent back.
    if (
      localTrackerHash({ ...project, offer: offerAfter }, status) !== siteHash
    ) {
      await pushProject(client, project.id, deps);
    }
  } else {
    await updateRecord(client, 'updateProject', project.id, {
      ...linkChange,
      siteTrackerId: row.id,
      siteUpdatedAt: row.updated_at,
      syncHash: siteHash,
    });
  }

  if (row.crm_id !== project.id) {
    await deps.rest.updateSiteTracker(deps.settings, row.id, {
      crm_id: project.id,
    });
  }
};

export const applySiteTracker = async (
  client: RecordApiClient,
  row: SiteTracker,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  const project = await findProject(client, row);

  if (project !== null) {
    await applyToExistingProject(client, row, project, deps);

    return;
  }

  // A crm_id without a live project means HubFaze deleted it: HubFaze's deletion wins.
  if (row.crm_id !== null) {
    if (row.is_active) {
      await deps.rest.updateSiteTracker(deps.settings, row.id, {
        is_active: false,
      });
    }

    return;
  }

  await createProjectFromTracker(client, row, deps);
};

export const applySiteTrackerDeleted = async (
  client: RecordApiClient,
  row: SiteTracker,
): Promise<void> => {
  const project = await findProject(client, row);

  if (project !== null) {
    await updateRecord(
      client,
      'updateProject',
      project.id,
      ARCHIVED_AND_UNLINKED,
    );
  }
};

const ensureProjectForTracker = async (
  client: RecordApiClient,
  trackerId: string,
  deps: TrackerSyncDependencies,
): Promise<{ id: string }> => {
  const known = await findProject(client, { id: trackerId, crm_id: null });

  if (known !== null) {
    return known;
  }

  const [tracker] = await deps.rest.fetchSiteRows<SiteTracker>(
    deps.settings,
    'trackers',
    { id: `eq.${trackerId}` },
  );

  if (tracker !== undefined) {
    await applySiteTracker(client, tracker, deps);
  }

  const created = await findProject(client, { id: trackerId, crm_id: null });

  if (created === null) {
    throw new Error(`Suivi ${trackerId} introuvable dans HubFaze`);
  }

  return created;
};

const ensurePhaseForTask = async (
  client: RecordApiClient,
  phaseSiteId: string,
  deps: TrackerSyncDependencies,
): Promise<{ id: string; projectId: string | null }> => {
  const known = await findPhase(client, { id: phaseSiteId, crm_id: null });

  if (known !== null) {
    return known;
  }

  const [phase] = await deps.rest.fetchSiteRows<SitePhase>(
    deps.settings,
    'tracker_phases',
    { id: `eq.${phaseSiteId}` },
  );

  if (phase !== undefined) {
    await applySitePhase(client, phase, deps);
  }

  const created = await findPhase(client, { id: phaseSiteId, crm_id: null });

  if (created === null) {
    throw new Error(`Phase ${phaseSiteId} introuvable dans HubFaze`);
  }

  return created;
};

export const applySitePhase = async (
  client: RecordApiClient,
  row: SitePhase,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  let phase = await findPhase(client, row);

  if (phase === null) {
    if (row.crm_id !== null) {
      await deps.rest.deleteSiteRowByCrmId(
        deps.settings,
        'tracker_phases',
        row.crm_id,
      );

      return;
    }

    const project = await ensureProjectForTracker(client, row.tracker_id, deps);

    phase = await createOnce(
      () =>
        client.mutation({
          createProjectPhase: {
            __args: {
              data: {
                id: row.id,
                ...phaseDataFromSite(row),
                projectId: project.id,
                siteId: row.id,
                siteUpdatedAt: row.updated_at,
                syncHash: syncHashOf(phaseFieldsFromSite(row)),
              },
            },
            id: true,
          },
        }),
      () => findPhase(client, row),
    );

    if (phase === null) {
      await deps.rest.updateSiteRow(deps.settings, 'tracker_phases', row.id, {
        crm_id: row.id,
      });

      return;
    }
  }

  if (isLateSiteChange(row.updated_at, phase.siteUpdatedAt)) {
    return;
  }

  const siteHash = syncHashOf(phaseFieldsFromSite(row));
  const trackerSiteId = phase.project?.siteTrackerId ?? null;
  const decision = decideMerge({
    siteHash,
    localHash:
      trackerSiteId === null
        ? ''
        : syncHashOf(phaseFieldsFromProjectPhase(phase, trackerSiteId)),
    syncHash: phase.syncHash,
    siteUpdatedAt: row.updated_at,
    localUpdatedAt: phase.updatedAt,
  });

  if (decision === 'push_local') {
    await pushPhase(client, phase.id, deps);
  } else {
    const moved =
      decision === 'apply_site' && row.tracker_id !== trackerSiteId
        ? {
            projectId: (
              await ensureProjectForTracker(client, row.tracker_id, deps)
            ).id,
          }
        : {};

    await updateRecord(client, 'updateProjectPhase', phase.id, {
      ...(decision === 'apply_site' ? phaseDataFromSite(row) : {}),
      ...moved,
      siteId: row.id,
      siteUpdatedAt: row.updated_at,
      syncHash: siteHash,
    });
  }

  if (row.crm_id !== phase.id) {
    await deps.rest.updateSiteRow(deps.settings, 'tracker_phases', row.id, {
      crm_id: phase.id,
    });
  }
};

export const applySitePhaseDeleted = async (
  client: RecordApiClient,
  row: SitePhase,
): Promise<void> => {
  const phase = await findPhase(client, row);

  if (phase !== null) {
    await client.mutation({
      deleteProjectPhase: { __args: { id: phase.id }, id: true },
    });
  }
};

export const applySiteTask = async (
  client: RecordApiClient,
  row: SiteTask,
  deps: TrackerSyncDependencies,
): Promise<void> => {
  let task = await findTask(client, row);

  if (task === null) {
    if (row.crm_id !== null) {
      await deps.rest.deleteSiteRowByCrmId(
        deps.settings,
        'tracker_tasks',
        row.crm_id,
      );

      return;
    }

    const phase = await ensurePhaseForTask(client, row.phase_id, deps);

    task = await createOnce(
      () =>
        client.mutation({
          createProjectTask: {
            __args: {
              data: {
                id: row.id,
                ...taskDataFromSite(row),
                phaseId: phase.id,
                projectId: phase.projectId,
                siteId: row.id,
                siteUpdatedAt: row.updated_at,
                syncHash: syncHashOf(taskFieldsFromSite(row)),
              },
            },
            id: true,
          },
        }),
      () => findTask(client, row),
    );

    if (task === null) {
      await deps.rest.updateSiteRow(deps.settings, 'tracker_tasks', row.id, {
        crm_id: row.id,
      });

      return;
    }
  }

  if (isLateSiteChange(row.updated_at, task.siteUpdatedAt)) {
    return;
  }

  const siteHash = syncHashOf(taskFieldsFromSite(row));
  const phaseSiteId = task.phase?.siteId ?? null;
  const decision = decideMerge({
    siteHash,
    localHash:
      phaseSiteId === null
        ? ''
        : syncHashOf(taskFieldsFromProjectTask(task, phaseSiteId)),
    syncHash: task.syncHash,
    siteUpdatedAt: row.updated_at,
    localUpdatedAt: task.updatedAt,
  });

  if (decision === 'push_local') {
    await pushTask(client, task.id, deps);
  } else {
    const moved =
      decision === 'apply_site' && row.phase_id !== phaseSiteId
        ? await ensurePhaseForTask(client, row.phase_id, deps).then(
            (phase) => ({
              phaseId: phase.id,
              projectId: phase.projectId,
            }),
          )
        : {};

    await updateRecord(client, 'updateProjectTask', task.id, {
      ...(decision === 'apply_site' ? taskDataFromSite(row) : {}),
      ...moved,
      siteId: row.id,
      siteUpdatedAt: row.updated_at,
      syncHash: siteHash,
    });
  }

  if (row.crm_id !== task.id) {
    await deps.rest.updateSiteRow(deps.settings, 'tracker_tasks', row.id, {
      crm_id: task.id,
    });
  }
};

export const applySiteTaskDeleted = async (
  client: RecordApiClient,
  row: SiteTask,
): Promise<void> => {
  const task = await findTask(client, row);

  if (task !== null) {
    await client.mutation({
      deleteProjectTask: { __args: { id: task.id }, id: true },
    });
  }
};
