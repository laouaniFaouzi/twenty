import { timingSafeEqual } from 'node:crypto';

import {
  handleLeadCreated,
  type LeadSyncDependencies,
} from 'src/utils/handle-lead-created';
import {
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import {
  applySitePhase,
  applySitePhaseDeleted,
  applySiteTask,
  applySiteTaskDeleted,
  applySiteTracker,
  applySiteTrackerDeleted,
} from 'src/utils/apply-site-trackers';
import { type SyncEntity } from 'src/objects/sync-log.object';
import { type SiteLead } from 'src/utils/lead-mapping';
import { type TrackerSyncDependencies } from 'src/utils/push-trackers';
import { type RecordApiClient } from 'src/utils/record-api-client';
import { recordSyncFailure } from 'src/utils/record-sync-failure';
import {
  type SitePhase,
  type SiteTask,
  type SiteTracker,
} from 'src/utils/tracker-mapping';

export type SiteWebhookResult = {
  status: 200 | 400 | 401 | 500;
  message: string;
};

export type SiteWebhookDependencies = LeadSyncDependencies & {
  trackers: TrackerSyncDependencies;
};

type SiteEventType = 'INSERT' | 'UPDATE' | 'DELETE';

type SiteEvent = {
  table: string;
  type: SiteEventType;
  record: Record<string, unknown> | null;
  oldRecord: Record<string, unknown> | null;
};

const SITE_EVENT_TYPES: SiteEventType[] = ['INSERT', 'UPDATE', 'DELETE'];

const SITE_LEAD_STATUSES = ['new', 'in_progress', 'done'];

const REQUIRED_LEAD_TEXT_COLUMNS = [
  'id',
  'ref',
  'source',
  'need',
  'name',
  'email',
  'created_at',
] as const;

const OPTIONAL_LEAD_TEXT_COLUMNS = [
  'timing',
  'company',
  'phone',
  'message',
  'crm_id',
] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isValidWebhookSecret = (
  received: string | undefined,
  expected: string,
): boolean => {
  if (received === undefined || expected === '') {
    return false;
  }

  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);

  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
};

const parseSiteEvent = (body: unknown): SiteEvent | null => {
  if (
    !isObject(body) ||
    typeof body.table !== 'string' ||
    !SITE_EVENT_TYPES.includes(body.type as SiteEventType)
  ) {
    return null;
  }

  const event: SiteEvent = {
    table: body.table,
    type: body.type as SiteEventType,
    record: isObject(body.record) ? body.record : null,
    oldRecord: isObject(body.old_record) ? body.old_record : null,
  };
  const row = event.type === 'DELETE' ? event.oldRecord : event.record;

  return row === null ? null : event;
};

const parseSiteLead = (
  row: Record<string, unknown> | null,
): SiteLead | null => {
  if (
    row === null ||
    REQUIRED_LEAD_TEXT_COLUMNS.some(
      (column) => typeof row[column] !== 'string',
    ) ||
    !SITE_LEAD_STATUSES.includes(row.status as string) ||
    OPTIONAL_LEAD_TEXT_COLUMNS.some(
      (column) => row[column] != null && typeof row[column] !== 'string',
    )
  ) {
    return null;
  }

  const optionalText = (column: (typeof OPTIONAL_LEAD_TEXT_COLUMNS)[number]) =>
    (row[column] as string | null | undefined) ?? null;

  return {
    id: row.id as string,
    ref: row.ref as string,
    source: row.source as string,
    need: row.need as string,
    timing: optionalText('timing'),
    name: row.name as string,
    company: optionalText('company'),
    email: row.email as string,
    phone: optionalText('phone'),
    message: optionalText('message'),
    status: row.status as SiteLead['status'],
    crm_id: optionalText('crm_id'),
    created_at: row.created_at as string,
  };
};

const hasTextColumns = (row: Record<string, unknown>, columns: string[]) =>
  columns.every((column) => typeof row[column] === 'string');

const hasOptionalId = (row: Record<string, unknown>) =>
  row.crm_id == null || typeof row.crm_id === 'string';

const parseSiteTracker = (row: Record<string, unknown>): SiteTracker | null =>
  hasTextColumns(row, ['id', 'client_name', 'offer', 'token', 'updated_at']) &&
  typeof row.is_active === 'boolean' &&
  hasOptionalId(row)
    ? ({ ...row, crm_id: row.crm_id ?? null } as SiteTracker)
    : null;

const parseSitePhase = (row: Record<string, unknown>): SitePhase | null =>
  hasTextColumns(row, ['id', 'tracker_id', 'name', 'updated_at']) &&
  typeof row.position === 'number' &&
  hasOptionalId(row)
    ? ({ ...row, crm_id: row.crm_id ?? null } as SitePhase)
    : null;

const SITE_TASK_STATUSES = ['todo', 'doing', 'done'];

const parseSiteTask = (row: Record<string, unknown>): SiteTask | null =>
  hasTextColumns(row, [
    'id',
    'phase_id',
    'name',
    'description',
    'updated_at',
  ]) &&
  SITE_TASK_STATUSES.includes(row.status as string) &&
  typeof row.position === 'number' &&
  hasOptionalId(row)
    ? ({ ...row, crm_id: row.crm_id ?? null } as SiteTask)
    : null;

type RoutedEvent = {
  entity: SyncEntity;
  siteId: string;
  run: () => Promise<string>;
};

const routeEvent = (
  client: RecordApiClient,
  event: SiteEvent,
  dependencies: SiteWebhookDependencies,
): RoutedEvent | 'invalid' | 'ignored' => {
  const row = event.type === 'DELETE' ? event.oldRecord : event.record;
  const isDeletion = event.type === 'DELETE';

  if (row === null) {
    return 'invalid';
  }

  switch (event.table) {
    case 'leads': {
      const lead = parseSiteLead(row);

      if (lead === null) {
        return 'invalid';
      }

      return {
        entity: 'LEAD',
        siteId: lead.id,
        run: async () => {
          if (event.type === 'INSERT') {
            const { outcome } = await handleLeadCreated(
              client,
              lead,
              dependencies,
            );

            return `Demande ${lead.ref} : ${outcome}`;
          }

          if (isDeletion) {
            await handleLeadDeleted(client, lead);

            return `Demande ${lead.ref} : suppression`;
          }

          await handleLeadUpdated(client, lead);

          return `Demande ${lead.ref} : mise à jour`;
        },
      };
    }
    case 'trackers': {
      const tracker = parseSiteTracker(row);

      return tracker === null
        ? 'invalid'
        : {
            entity: 'TRACKER',
            siteId: tracker.id,
            run: async () => {
              await (isDeletion
                ? applySiteTrackerDeleted(client, tracker)
                : applySiteTracker(client, tracker, dependencies.trackers));

              return `Suivi ${tracker.id} : ${event.type}`;
            },
          };
    }
    case 'tracker_phases': {
      const phase = parseSitePhase(row);

      return phase === null
        ? 'invalid'
        : {
            entity: 'PHASE',
            siteId: phase.id,
            run: async () => {
              await (isDeletion
                ? applySitePhaseDeleted(client, phase)
                : applySitePhase(client, phase, dependencies.trackers));

              return `Phase ${phase.id} : ${event.type}`;
            },
          };
    }
    case 'tracker_tasks': {
      const task = parseSiteTask(row);

      return task === null
        ? 'invalid'
        : {
            entity: 'TASK',
            siteId: task.id,
            run: async () => {
              await (isDeletion
                ? applySiteTaskDeleted(client, task)
                : applySiteTask(client, task, dependencies.trackers));

              return `Tâche ${task.id} : ${event.type}`;
            },
          };
    }
    default:
      return 'ignored';
  }
};

export const handleSiteWebhook = async (
  client: RecordApiClient,
  request: { secret: string | undefined; body: unknown },
  dependencies: SiteWebhookDependencies,
): Promise<SiteWebhookResult> => {
  if (
    !isValidWebhookSecret(request.secret, dependencies.settings.webhookSecret)
  ) {
    return { status: 401, message: 'Secret invalide' };
  }

  const event = parseSiteEvent(request.body);

  if (event === null) {
    return { status: 400, message: 'Événement invalide' };
  }

  const routed = routeEvent(client, event, dependencies);

  if (routed === 'ignored') {
    return { status: 200, message: `Table ${event.table} ignorée` };
  }

  if (routed === 'invalid') {
    return { status: 400, message: 'Ligne invalide' };
  }

  try {
    return { status: 200, message: await routed.run() };
  } catch (error) {
    await recordSyncFailure(
      client,
      {
        direction: 'SITE_TO_CRM',
        entity: routed.entity,
        siteId: routed.siteId,
        recordId: null,
        error,
      },
      dependencies.trackers.now(),
    );

    return {
      status: 500,
      message: error instanceof Error ? error.message : 'Échec du traitement',
    };
  }
};
