import { timingSafeEqual } from 'node:crypto';

import {
  handleLeadCreated,
  type LeadSyncDependencies,
} from 'src/utils/handle-lead-created';
import {
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import { type SiteLead } from 'src/utils/lead-mapping';
import { type RecordApiClient } from 'src/utils/record-api-client';

export type SiteWebhookResult = { status: 200 | 400 | 401; message: string };

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

export const handleSiteWebhook = async (
  client: RecordApiClient,
  request: { secret: string | undefined; body: unknown },
  dependencies: LeadSyncDependencies,
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

  if (event.table !== 'leads') {
    return { status: 200, message: `Table ${event.table} ignorée` };
  }

  const lead = parseSiteLead(
    event.type === 'DELETE' ? event.oldRecord : event.record,
  );

  if (lead === null) {
    return { status: 400, message: 'Demande invalide' };
  }

  switch (event.type) {
    case 'INSERT': {
      const { outcome } = await handleLeadCreated(client, lead, dependencies);

      return { status: 200, message: `Demande ${lead.ref} : ${outcome}` };
    }
    case 'UPDATE':
      await handleLeadUpdated(client, lead);

      return { status: 200, message: `Demande ${lead.ref} : mise à jour` };
    case 'DELETE':
      await handleLeadDeleted(client, lead);

      return { status: 200, message: `Demande ${lead.ref} : suppression` };
  }
};
