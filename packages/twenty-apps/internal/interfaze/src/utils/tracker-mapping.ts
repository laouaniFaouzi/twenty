import { createHash, randomBytes as cryptoRandomBytes } from 'node:crypto';

import { type Offer, OFFERS } from 'src/constants/offer';
import { type ProjectStatus } from 'src/objects/project.object';
import { type ProjectTaskStatus } from 'src/objects/project-task.object';

export type SiteTracker = {
  id: string;
  client_name: string;
  offer: string;
  token: string;
  is_active: boolean;
  crm_id: string | null;
  updated_at: string;
};

export type SitePhase = {
  id: string;
  tracker_id: string;
  name: string;
  position: number;
  crm_id: string | null;
  updated_at: string;
};

export type SiteTask = {
  id: string;
  phase_id: string;
  name: string;
  description: string;
  status: string;
  position: number;
  crm_id: string | null;
  updated_at: string;
};

export type TrackerFields = {
  client_name: string;
  offer: string;
  is_active: boolean;
};

export type PhaseFields = {
  tracker_id: string;
  name: string;
  position: number;
};

export type TaskFields = {
  phase_id: string;
  name: string;
  description: string;
  status: string;
  position: number;
};

export type MergeDecision = 'in_sync' | 'apply_site' | 'push_local';

const TRACKER_TOKEN_BYTES = 24;

const TASK_STATUSES: ProjectTaskStatus[] = ['TODO', 'DOING', 'DONE'];

export const generateTrackerToken = (
  randomBytes: (size: number) => Buffer = cryptoRandomBytes,
): string => randomBytes(TRACKER_TOKEN_BYTES).toString('base64url');

export const trackerUrlFor = (siteUrl: string, token: string): string =>
  `${siteUrl}/suivi/${token}`;

export const tokenFromTrackerUrl = (url: string | null): string | null =>
  url?.match(/\/suivi\/([A-Za-z0-9_-]+)$/)?.[1] ?? null;

export const trackerFieldsFromProject = ({
  name,
  offer,
  status,
  companyName,
}: {
  name: string;
  offer: Offer | null;
  status: ProjectStatus;
  companyName: string | null;
}): TrackerFields | null =>
  offer === null
    ? null
    : {
        client_name: companyName?.trim() || name.trim(),
        offer: offer.toLowerCase(),
        is_active: status !== 'ARCHIVED',
      };

export const phaseFieldsFromProjectPhase = (
  { name, position }: { name: string | null; position: number },
  trackerSiteId: string,
): PhaseFields => ({ tracker_id: trackerSiteId, name: name ?? '', position });

export const taskFieldsFromProjectTask = (
  {
    name,
    description,
    status,
    position,
  }: {
    name: string | null;
    description: string | null;
    status: ProjectTaskStatus | null;
    position: number;
  },
  phaseSiteId: string,
): TaskFields => ({
  phase_id: phaseSiteId,
  name: name ?? '',
  description: description ?? '',
  status: (status ?? 'TODO').toLowerCase(),
  position,
});

export const trackerFieldsFromSite = (row: SiteTracker): TrackerFields => ({
  client_name: row.client_name,
  offer: row.offer,
  is_active: row.is_active,
});

export const phaseFieldsFromSite = (row: SitePhase): PhaseFields => ({
  tracker_id: row.tracker_id,
  name: row.name,
  position: row.position,
});

export const taskFieldsFromSite = (row: SiteTask): TaskFields => ({
  phase_id: row.phase_id,
  name: row.name,
  description: row.description,
  status: row.status,
  position: row.position,
});

const offerFromSite = (offer: string): Offer | null =>
  OFFERS.find((candidate) => candidate.toLowerCase() === offer) ?? null;

export const projectDataFromTracker = (
  row: SiteTracker,
  currentStatus: ProjectStatus | null,
): { offer: Offer | null; status: ProjectStatus } => ({
  offer: offerFromSite(row.offer),
  status: !row.is_active
    ? 'ARCHIVED'
    : currentStatus === 'LAUNCHED'
      ? 'LAUNCHED'
      : 'IN_PROGRESS',
});

export const phaseDataFromSite = (row: SitePhase) => ({
  name: row.name,
  position: row.position,
});

export const taskDataFromSite = (row: SiteTask) => ({
  name: row.name,
  description: row.description,
  status:
    TASK_STATUSES.find((status) => status.toLowerCase() === row.status) ??
    'TODO',
  position: row.position,
});

export const syncHashOf = (fields: Record<string, unknown>): string =>
  createHash('sha256')
    .update(
      JSON.stringify(
        Object.keys(fields)
          .sort()
          .map((key) => [key, fields[key]]),
      ),
    )
    .digest('hex');

// syncHash is the last state both sides agreed on: whichever side still matches it did not change.
export const decideMerge = ({
  siteHash,
  localHash,
  syncHash,
  siteUpdatedAt,
  localUpdatedAt,
}: {
  siteHash: string;
  localHash: string;
  syncHash: string | null;
  siteUpdatedAt: string;
  localUpdatedAt: string;
}): MergeDecision => {
  if (siteHash === localHash) {
    return 'in_sync';
  }

  if (localHash === syncHash) {
    return 'apply_site';
  }

  if (siteHash === syncHash) {
    return 'push_local';
  }

  return Date.parse(siteUpdatedAt) >= Date.parse(localUpdatedAt)
    ? 'apply_site'
    : 'push_local';
};

export const isLateSiteChange = (
  rowUpdatedAt: string,
  siteUpdatedAt: string | null,
): boolean =>
  siteUpdatedAt !== null &&
  Date.parse(rowUpdatedAt) <= Date.parse(siteUpdatedAt);
