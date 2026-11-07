import { type Offer } from 'src/constants/offer';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { type ProjectStatus } from 'src/objects/project.object';
import { type ProjectTaskStatus } from 'src/objects/project-task.object';
import { type SyncEntity } from 'src/objects/sync-log.object';
import {
  applySitePhase,
  applySiteTask,
  applySiteTracker,
} from 'src/utils/apply-site-trackers';
import { fetchAllRecords } from 'src/utils/fetch-all-records';
import { handleLeadCreated } from 'src/utils/handle-lead-created';
import {
  findLeadOpportunity,
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import { type SiteWebhookDependencies } from 'src/utils/handle-site-webhook';
import { type SiteLead, statusForStage } from 'src/utils/lead-mapping';
import { presentText } from 'src/utils/present-text';
import {
  pushPhase,
  pushProjectTree,
  pushTask,
  unlinkProjectFromSite,
} from 'src/utils/push-trackers';
import { type RecordApiClient } from 'src/utils/record-api-client';
import { recordSyncFailure } from 'src/utils/record-sync-failure';
import { type SiteLeadStatus } from 'src/utils/supabase-leads';
import {
  phaseFieldsFromProjectPhase,
  phaseFieldsFromSite,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  syncHashOf,
  taskFieldsFromProjectTask,
  taskFieldsFromSite,
  tokenFromTrackerUrl,
  trackerFieldsFromProject,
  trackerFieldsFromSite,
} from 'src/utils/tracker-mapping';

export type ReconciliationOptions = { now: Date; full: boolean };

export type ReconciliationSummary = {
  trackers: number;
  leads: number;
  failures: number;
};

type ProjectSnapshot = {
  id: string;
  name: string | null;
  offer: Offer | null;
  status: ProjectStatus;
  siteTrackerId: string | null;
  syncHash: string | null;
  trackerUrl: { primaryLinkUrl: string | null } | null;
  company: { name: string | null } | null;
};

type PhaseSnapshot = {
  id: string;
  name: string | null;
  position: number;
  siteId: string | null;
  siteUpdatedAt: string | null;
  syncHash: string | null;
  project: { siteTrackerId: string | null } | null;
};

type TaskSnapshot = {
  id: string;
  name: string | null;
  description: string | null;
  status: ProjectTaskStatus | null;
  position: number;
  siteId: string | null;
  siteUpdatedAt: string | null;
  syncHash: string | null;
  phase: { siteId: string | null } | null;
};

type OpportunitySnapshot = {
  id: string;
  interfazeStage: InterfazeStage;
  siteLeadId: string;
  siteLeadStatusSeen: string | null;
};

type SiteTable = 'trackers' | 'tracker_phases' | 'tracker_tasks' | 'leads';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const WINDOW_IN_DAYS = 30;

const LOG_RETENTION_IN_DAYS = 90;

const LEAD_RETENTION_IN_YEARS = 3;

// Keeps every `in.(…)` URL far below the size gateways accept.
const IDS_PER_SITE_READ = 100;

const STATUS_RANK: Record<SiteLeadStatus, number> = {
  new: 0,
  in_progress: 1,
  done: 2,
};

const PROJECT_SNAPSHOT_NODE = {
  id: true,
  name: true,
  offer: true,
  status: true,
  siteTrackerId: true,
  syncHash: true,
  trackerUrl: { primaryLinkUrl: true },
  company: { name: true },
};

const PHASE_SNAPSHOT_NODE = {
  id: true,
  name: true,
  position: true,
  siteId: true,
  siteUpdatedAt: true,
  syncHash: true,
  project: { siteTrackerId: true },
};

const TASK_SNAPSHOT_NODE = {
  id: true,
  name: true,
  description: true,
  status: true,
  position: true,
  siteId: true,
  siteUpdatedAt: true,
  syncHash: true,
  phase: { siteId: true },
};

const daysBefore = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_IN_MILLISECONDS).toISOString();

const yearsBefore = (now: Date, years: number) => {
  const date = new Date(now);

  date.setUTCFullYear(date.getUTCFullYear() - years);

  return date.toISOString();
};

const chunks = (ids: string[]): string[][] =>
  Array.from(
    { length: Math.ceil(ids.length / IDS_PER_SITE_READ) },
    (_, index) =>
      ids.slice(index * IDS_PER_SITE_READ, (index + 1) * IDS_PER_SITE_READ),
  );

const uniqueById = <TRow extends { id: string }>(rows: TRow[]): TRow[] => [
  ...new Map(rows.map((row) => [row.id, row])).values(),
];

const byPresentKey = <TRecord>(
  records: TRecord[],
  key: (record: TRecord) => string | null | undefined,
): Map<string, TRecord> =>
  new Map(
    records.flatMap((record) => {
      const value = presentText(key(record) ?? null);

      return value === null ? [] : [[value, record] as const];
    }),
  );

// In sync: both sides still hold the state they last agreed on, and the site knows the HubFaze id.
const isTrackerInSync = (row: SiteTracker, project: ProjectSnapshot) => {
  const fields = trackerFieldsFromProject({
    name: project.name ?? '',
    offer: project.offer,
    status: project.status,
    companyName: project.company?.name ?? null,
  });
  const siteHash = syncHashOf(trackerFieldsFromSite(row));

  return (
    fields !== null &&
    row.crm_id === project.id &&
    presentText(project.syncHash) === siteHash &&
    syncHashOf(fields) === siteHash &&
    tokenFromTrackerUrl(project.trackerUrl?.primaryLinkUrl ?? null) ===
      row.token
  );
};

const isPhaseInSync = (row: SitePhase, phase: PhaseSnapshot) => {
  const trackerSiteId = presentText(phase.project?.siteTrackerId ?? null);
  const siteHash = syncHashOf(phaseFieldsFromSite(row));

  return (
    trackerSiteId !== null &&
    row.crm_id === phase.id &&
    presentText(phase.syncHash) === siteHash &&
    syncHashOf(phaseFieldsFromProjectPhase(phase, trackerSiteId)) === siteHash
  );
};

const isTaskInSync = (row: SiteTask, task: TaskSnapshot) => {
  const phaseSiteId = presentText(task.phase?.siteId ?? null);
  const siteHash = syncHashOf(taskFieldsFromSite(row));

  return (
    phaseSiteId !== null &&
    row.crm_id === task.id &&
    presentText(task.syncHash) === siteHash &&
    syncHashOf(taskFieldsFromProjectTask(task, phaseSiteId)) === siteHash
  );
};

export const runReconciliation = async (
  client: RecordApiClient,
  deps: SiteWebhookDependencies,
  { now, full }: ReconciliationOptions,
): Promise<ReconciliationSummary> => {
  const { settings, trackers: trackerDeps } = deps;
  const { rest } = trackerDeps;
  const since = daysBefore(now, WINDOW_IN_DAYS);
  const summary: ReconciliationSummary = { trackers: 0, leads: 0, failures: 0 };

  const attempt = async (
    entity: SyncEntity,
    siteId: string | null,
    recordId: string | null,
    step: () => Promise<unknown>,
  ): Promise<boolean> => {
    try {
      await step();

      return true;
    } catch (error) {
      summary.failures += 1;
      await recordSyncFailure(
        client,
        { direction: 'RECONCILIATION', entity, siteId, recordId, error },
        now,
      );

      return false;
    }
  };

  // A failed step is noted and the pass goes on with the next one.
  const runStep = (
    label: string,
    entity: SyncEntity,
    step: () => Promise<unknown>,
  ) =>
    attempt(entity, null, null, async () => {
      try {
        await step();
      } catch (error) {
        throw new Error(
          `${label} : ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

  const readInChunks = async <TRow>(
    table: SiteTable,
    column: string,
    ids: string[],
  ): Promise<TRow[]> => {
    const rows: TRow[] = [];

    for (const chunk of chunks(ids)) {
      rows.push(
        ...(await rest.fetchSiteRows<TRow>(settings, table, {
          [column]: `in.(${chunk.join(',')})`,
        })),
      );
    }

    return rows;
  };

  // 1. Trackers of the site with their phases and tasks, against one snapshot of HubFaze.
  let siteTrackers: SiteTracker[] = [];
  let sitePhases: SitePhase[] = [];
  let siteTasks: SiteTask[] = [];

  // Every later "missing on the site" decision relies on a complete read.
  const siteRead = await runStep('Lecture des suivis', 'TRACKER', async () => {
    siteTrackers = uniqueById(
      full
        ? await rest.fetchSiteRows<SiteTracker>(settings, 'trackers', {})
        : [
            ...(await rest.fetchSiteRows<SiteTracker>(settings, 'trackers', {
              is_active: 'eq.true',
            })),
            ...(await rest.fetchSiteRows<SiteTracker>(settings, 'trackers', {
              updated_at: `gte.${since}`,
            })),
          ],
    );
    sitePhases = await readInChunks<SitePhase>(
      'tracker_phases',
      'tracker_id',
      siteTrackers.map(({ id }) => id),
    );
    siteTasks = await readInChunks<SiteTask>(
      'tracker_tasks',
      'phase_id',
      sitePhases.map(({ id }) => id),
    );
  });

  const trackerIds = siteTrackers.map(({ id }) => id);

  if (siteRead && trackerIds.length > 0) {
    await runStep('Suivis', 'TRACKER', async () => {
      const projects = await fetchAllRecords<ProjectSnapshot>(
        client,
        'projects',
        {
          filter: { siteTrackerId: { in: trackerIds } },
          node: PROJECT_SNAPSHOT_NODE,
        },
      );
      const projectIds = projects.map(({ id }) => id);
      const byProject = { projectId: { in: projectIds } };
      const phases =
        projectIds.length === 0
          ? []
          : await fetchAllRecords<PhaseSnapshot>(client, 'projectPhases', {
              filter: byProject,
              node: PHASE_SNAPSHOT_NODE,
            });
      const tasks =
        projectIds.length === 0
          ? []
          : await fetchAllRecords<TaskSnapshot>(client, 'projectTasks', {
              filter: byProject,
              node: TASK_SNAPSHOT_NODE,
            });
      const projectByTracker = byPresentKey(
        projects,
        (project) => project.siteTrackerId,
      );
      const phaseBySiteId = byPresentKey(phases, (phase) => phase.siteId);
      const taskBySiteId = byPresentKey(tasks, (task) => task.siteId);

      for (const tracker of siteTrackers) {
        summary.trackers += 1;

        const project = projectByTracker.get(tracker.id);

        if (project === undefined || !isTrackerInSync(tracker, project)) {
          await attempt('TRACKER', tracker.id, tracker.crm_id, () =>
            applySiteTracker(client, tracker, trackerDeps),
          );
        }
      }

      for (const phase of sitePhases) {
        const known = phaseBySiteId.get(phase.id);

        if (known === undefined || !isPhaseInSync(phase, known)) {
          await attempt('PHASE', phase.id, phase.crm_id, () =>
            applySitePhase(client, phase, trackerDeps),
          );
        }
      }

      for (const task of siteTasks) {
        const known = taskBySiteId.get(task.id);

        if (known === undefined || !isTaskInSync(task, known)) {
          await attempt('TASK', task.id, task.crm_id, () =>
            applySiteTask(client, task, trackerDeps),
          );
        }
      }

      // 2. HubFaze phases and tasks of those trackers that the site no longer has, or never got.
      const knownSiteIds = new Set([
        ...sitePhases.map(({ id }) => id),
        ...siteTasks.map(({ id }) => id),
      ]);

      for (const [records, entity, deletion, push] of [
        [phases, 'PHASE', 'deleteProjectPhase', pushPhase],
        [tasks, 'TASK', 'deleteProjectTask', pushTask],
      ] as const) {
        for (const record of records) {
          const siteId = presentText(record.siteId);

          if (siteId === null) {
            await attempt(entity, null, record.id, () =>
              push(client, record.id, trackerDeps),
            );
          } else if (
            !knownSiteIds.has(siteId) &&
            // Synced after this pass read the site: not missing, just newer than the read.
            record.siteUpdatedAt !== null &&
            Date.parse(record.siteUpdatedAt) < now.getTime()
          ) {
            await attempt(entity, siteId, record.id, () =>
              client.mutation({
                [deletion]: { __args: { id: record.id }, id: true },
              }),
            );
          }
        }
      }
    });
  }

  // 3. HubFaze projects never sent, and linked projects whose tracker was not read.
  await runStep('Projets non envoyés', 'TRACKER', async () => {
    for (const project of await fetchAllRecords<{ id: string }>(
      client,
      'projects',
      {
        filter: {
          // Twenty stores an empty text field as '', so "no tracker" is either.
          or: [
            { siteTrackerId: { is: 'NULL' } },
            { siteTrackerId: { eq: '' } },
          ],
          offer: { is: 'NOT_NULL' },
          status: { neq: 'ARCHIVED' },
        },
        node: { id: true },
      },
    )) {
      await attempt('TRACKER', null, project.id, () =>
        pushProjectTree(client, project.id, trackerDeps),
      );
    }
  });

  if (siteRead) {
    await runStep('Suivis non lus', 'TRACKER', async () => {
      const readTrackerIds = new Set(trackerIds);
      const unreadProjects = (
        await fetchAllRecords<{ id: string; siteTrackerId: string }>(
          client,
          'projects',
          {
            filter: {
              siteTrackerId: { neq: '' },
              status: { neq: 'ARCHIVED' },
            },
            node: { id: true, siteTrackerId: true },
          },
        )
      ).filter(({ siteTrackerId }) => !readTrackerIds.has(siteTrackerId));

      if (unreadProjects.length === 0) {
        return;
      }

      const unreadTrackers = await readInChunks<SiteTracker>(
        'trackers',
        'id',
        unreadProjects.map(({ siteTrackerId }) => siteTrackerId),
      );

      for (const project of unreadProjects) {
        const tracker = unreadTrackers.find(
          ({ id }) => id === project.siteTrackerId,
        );

        await attempt('TRACKER', project.siteTrackerId, project.id, () =>
          tracker === undefined
            ? unlinkProjectFromSite(client, project.id)
            : applySiteTracker(client, tracker, trackerDeps),
        );
      }
    });
  }

  // 4. Leads created or changed in the window.
  await runStep('Demandes', 'LEAD', async () => {
    const siteLeads = await rest.fetchSiteRows<SiteLead>(
      settings,
      'leads',
      full ? {} : { updated_at: `gte.${since}` },
    );
    const opportunities =
      siteLeads.length === 0
        ? []
        : await fetchAllRecords<OpportunitySnapshot>(client, 'opportunities', {
            filter: { siteLeadId: { in: siteLeads.map(({ id }) => id) } },
            node: {
              id: true,
              interfazeStage: true,
              siteLeadId: true,
              siteLeadStatusSeen: true,
            },
          });
    const opportunityByLead = byPresentKey(
      opportunities,
      (opportunity) => opportunity.siteLeadId,
    );

    for (const lead of siteLeads) {
      summary.leads += 1;

      const known = opportunityByLead.get(lead.id);

      if (
        known !== undefined &&
        lead.crm_id === known.id &&
        known.siteLeadStatusSeen === lead.status &&
        STATUS_RANK[statusForStage(known.interfazeStage)] <=
          STATUS_RANK[lead.status]
      ) {
        continue;
      }

      await attempt('LEAD', lead.id, lead.crm_id, async () => {
        if (lead.crm_id === null) {
          await handleLeadCreated(client, lead, deps);
        }

        await handleLeadUpdated(client, lead);

        const opportunity = await findLeadOpportunity(client, lead);

        if (opportunity === null || opportunity.siteLeadId !== lead.id) {
          return;
        }

        const status = statusForStage(opportunity.interfazeStage);

        // A stage change the site missed; a site status ahead of HubFaze is never pulled back.
        if (
          opportunity.siteLeadStatusSeen === lead.status &&
          STATUS_RANK[status] > STATUS_RANK[lead.status]
        ) {
          await deps.patchLead(settings, lead.id, { status });
          await client.mutation({
            updateOpportunity: {
              __args: {
                id: opportunity.id,
                data: { siteLeadStatusSeen: status },
              },
              id: true,
            },
          });
        }
      });
    }
  });

  // 5. Three-year rule for opportunities whose lead disappeared without its deletion event.
  await runStep('Règle des 3 ans', 'LEAD', async () => {
    const expiredOpportunities = await fetchAllRecords<{
      id: string;
      siteLeadId: string;
      requestRef: string | null;
    }>(client, 'opportunities', {
      filter: {
        siteLeadId: { neq: '' },
        receivedAt: { lt: yearsBefore(now, LEAD_RETENTION_IN_YEARS) },
        interfazeStage: { neq: 'WON' },
      },
      node: { id: true, siteLeadId: true, requestRef: true },
    });

    if (expiredOpportunities.length === 0) {
      return;
    }

    const remainingLeadIds = new Set(
      (
        await readInChunks<{ id: string }>(
          'leads',
          'id',
          expiredOpportunities.map(({ siteLeadId }) => siteLeadId),
        )
      ).map(({ id }) => id),
    );

    for (const opportunity of expiredOpportunities) {
      if (!remainingLeadIds.has(opportunity.siteLeadId)) {
        await attempt('LEAD', opportunity.siteLeadId, opportunity.id, () =>
          handleLeadDeleted(client, {
            id: opportunity.siteLeadId,
            ref: opportunity.requestRef ?? '',
            crm_id: opportunity.id,
          }),
        );
      }
    }
  });

  // 6. The Journal keeps 90 days.
  await runStep('Purge du Journal', 'TRACKER', () =>
    client.mutation({
      deleteSyncLogs: {
        __args: {
          filter: {
            occurredAt: { lt: daysBefore(now, LOG_RETENTION_IN_DAYS) },
          },
        },
        id: true,
      },
    }),
  );

  return summary;
};
