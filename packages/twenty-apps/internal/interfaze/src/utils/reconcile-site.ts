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
import { pushPhase, pushProjectTree, pushTask } from 'src/utils/push-trackers';
import { type RecordApiClient } from 'src/utils/record-api-client';
import { presentText } from 'src/utils/present-text';
import { recordSyncFailure } from 'src/utils/record-sync-failure';
import { type SiteLeadStatus } from 'src/utils/supabase-leads';
import {
  type SitePhase,
  type SiteTask,
  type SiteTracker,
} from 'src/utils/tracker-mapping';

export type ReconciliationOptions = { now: Date; full: boolean };

export type ReconciliationSummary = {
  trackers: number;
  leads: number;
  failures: number;
};

type LinkedRecord = {
  id: string;
  siteId: string | null;
  siteUpdatedAt: string | null;
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const WINDOW_IN_DAYS = 30;

const LOG_RETENTION_IN_DAYS = 90;

const LEAD_RETENTION_IN_YEARS = 3;

const STATUS_RANK: Record<SiteLeadStatus, number> = {
  new: 0,
  in_progress: 1,
  done: 2,
};

const ARCHIVED_AND_UNLINKED = {
  status: 'ARCHIVED',
  siteTrackerId: null,
  siteUpdatedAt: null,
  syncHash: null,
};

const daysBefore = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_IN_MILLISECONDS).toISOString();

const yearsBefore = (now: Date, years: number) => {
  const date = new Date(now);

  date.setUTCFullYear(date.getUTCFullYear() - years);

  return date.toISOString();
};

const inList = (ids: string[]) => `in.(${ids.join(',')})`;

const uniqueById = <TRow extends { id: string }>(rows: TRow[]): TRow[] => [
  ...new Map(rows.map((row) => [row.id, row])).values(),
];

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
  ) => {
    try {
      await step();
    } catch (error) {
      summary.failures += 1;
      await recordSyncFailure(
        client,
        { direction: 'RECONCILIATION', entity, siteId, recordId, error },
        now,
      );
    }
  };

  // 1. Trackers of the site, with their phases and tasks.
  const siteTrackers = uniqueById(
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
  const trackerIds = siteTrackers.map(({ id }) => id);
  const sitePhases =
    trackerIds.length === 0
      ? []
      : await rest.fetchSiteRows<SitePhase>(settings, 'tracker_phases', {
          tracker_id: inList(trackerIds),
        });
  const sitePhaseIds = sitePhases.map(({ id }) => id);
  const siteTasks =
    sitePhaseIds.length === 0
      ? []
      : await rest.fetchSiteRows<SiteTask>(settings, 'tracker_tasks', {
          phase_id: inList(sitePhaseIds),
        });

  for (const tracker of siteTrackers) {
    summary.trackers += 1;
    await attempt('TRACKER', tracker.id, tracker.crm_id, () =>
      applySiteTracker(client, tracker, trackerDeps),
    );
  }

  for (const phase of sitePhases) {
    await attempt('PHASE', phase.id, phase.crm_id, () =>
      applySitePhase(client, phase, trackerDeps),
    );
  }

  for (const task of siteTasks) {
    await attempt('TASK', task.id, task.crm_id, () =>
      applySiteTask(client, task, trackerDeps),
    );
  }

  // 2. HubFaze phases and tasks of those trackers that the site no longer has, or never got.
  if (trackerIds.length > 0) {
    const projectIds = (
      await fetchAllRecords<{ id: string }>(client, 'projects', {
        filter: { siteTrackerId: { in: trackerIds } },
        node: { id: true, siteTrackerId: true },
      })
    ).map(({ id }) => id);

    if (projectIds.length > 0) {
      const linkedNode = { id: true, siteId: true, siteUpdatedAt: true };
      const knownSiteIds = new Set([
        ...sitePhaseIds,
        ...siteTasks.map(({ id }) => id),
      ]);

      for (const [root, entity, deletion, push] of [
        ['projectPhases', 'PHASE', 'deleteProjectPhase', pushPhase],
        ['projectTasks', 'TASK', 'deleteProjectTask', pushTask],
      ] as const) {
        const records = await fetchAllRecords<LinkedRecord>(client, root, {
          filter: { projectId: { in: projectIds } },
          node: linkedNode,
        });

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
    }
  }

  // 3. HubFaze projects never sent, and linked projects whose tracker was not read.
  for (const project of await fetchAllRecords<{ id: string }>(
    client,
    'projects',
    {
      filter: {
        // Twenty stores an empty text field as '', so "no tracker" is either.
        or: [{ siteTrackerId: { is: 'NULL' } }, { siteTrackerId: { eq: '' } }],
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

  if (unreadProjects.length > 0) {
    const unreadTrackers = await rest.fetchSiteRows<SiteTracker>(
      settings,
      'trackers',
      { id: inList(unreadProjects.map(({ siteTrackerId }) => siteTrackerId)) },
    );

    for (const project of unreadProjects) {
      const tracker = unreadTrackers.find(
        ({ id }) => id === project.siteTrackerId,
      );

      await attempt('TRACKER', project.siteTrackerId, project.id, () =>
        tracker === undefined
          ? client.mutation({
              updateProject: {
                __args: { id: project.id, data: ARCHIVED_AND_UNLINKED },
                id: true,
              },
            })
          : applySiteTracker(client, tracker, trackerDeps),
      );
    }
  }

  // 4. Leads created or changed in the window.
  const siteLeads = await rest.fetchSiteRows<SiteLead>(
    settings,
    'leads',
    full ? {} : { updated_at: `gte.${since}` },
  );

  for (const lead of siteLeads) {
    summary.leads += 1;
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

  // 5. Three-year rule for opportunities whose lead disappeared without its deletion event.
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

  if (expiredOpportunities.length > 0) {
    const remainingLeadIds = new Set(
      (
        await rest.fetchSiteRows<{ id: string }>(settings, 'leads', {
          id: inList(expiredOpportunities.map(({ siteLeadId }) => siteLeadId)),
        })
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
  }

  // 6. The Journal keeps 90 days.
  await client.mutation({
    deleteSyncLogs: {
      __args: {
        filter: { occurredAt: { lt: daysBefore(now, LOG_RETENTION_IN_DAYS) } },
      },
      id: true,
    },
  });

  return summary;
};
