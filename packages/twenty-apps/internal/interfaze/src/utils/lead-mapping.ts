import { OFFER_LABELS, type Offer } from 'src/constants/offer';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { type Need } from 'src/fields/opportunity-need.field';
import { type RequestSource } from 'src/fields/opportunity-request-source.field';
import { type Timing } from 'src/fields/opportunity-timing.field';
import { type SiteLeadStatus } from 'src/utils/supabase-leads';

export type SiteLead = {
  id: string;
  ref: string;
  source: string;
  need: string;
  timing: string | null;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: SiteLeadStatus;
  crm_id: string | null;
  created_at: string;
};

export type PersonPhone = {
  primaryPhoneNumber: string;
  primaryPhoneCallingCode: string;
  primaryPhoneCountryCode: string;
};

const NEED_BY_SITE_VALUE: Record<string, Need> = {
  probleme: 'PROBLEM',
  web: 'WEB',
  shop: 'SHOP',
  app: 'APP',
  smart: 'SMART',
};

const REQUEST_SOURCE_BY_SITE_VALUE: Record<string, RequestSource> = {
  accueil: 'HOME',
  contact: 'CONTACT',
  'offre:web': 'OFFER_WEB',
  'offre:shop': 'OFFER_SHOP',
  'offre:app': 'OFFER_APP',
  'offre:smart': 'OFFER_SMART',
};

const TIMING_BY_SITE_VALUE: Record<string, Timing> = {
  asap: 'ASAP',
  '1-3-mois': 'ONE_TO_THREE_MONTHS',
  'sans-date': 'NO_DATE',
};

const NEED_LABELS: Record<Need, string> = {
  PROBLEM: 'Problème à régler',
  ...OFFER_LABELS,
};

const STATUS_BY_STAGE: Record<InterfazeStage, SiteLeadStatus> = {
  NEW_REQUEST: 'new',
  DISCUSSION: 'in_progress',
  QUOTE_SENT: 'in_progress',
  WON: 'done',
  LOST: 'done',
};

const STATUS_RANK: Record<SiteLeadStatus, number> = {
  new: 0,
  in_progress: 1,
  done: 2,
};

const CLOSED_STAGES: InterfazeStage[] = ['WON', 'LOST'];

const lookUp = <TValue>(
  table: Record<string, TValue>,
  key: string | null,
): TValue | null =>
  key !== null && Object.prototype.hasOwnProperty.call(table, key)
    ? table[key]
    : null;

const isOffer = (need: Need | null): need is Offer =>
  need !== null && need !== 'PROBLEM';

export const splitPersonName = (
  name: string,
): { firstName: string; lastName: string } => {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);

  return { firstName, lastName: rest.join(' ') };
};

export const normalizeFrenchPhone = (
  raw: string | null,
): PersonPhone | null => {
  const trimmed = raw?.trim() ?? '';
  const digits = trimmed.replace(/\D/g, '');

  const frenchNationalNumber =
    digits.match(/^0([1-9]\d{8})$/)?.[1] ??
    digits.match(/^(?:0033|33)([1-9]\d{8})$/)?.[1];
  const isInternational = trimmed.startsWith('+') || digits.startsWith('00');

  if (
    frenchNationalNumber !== undefined &&
    (isInternational || digits.startsWith('0'))
  ) {
    return {
      primaryPhoneNumber: frenchNationalNumber,
      primaryPhoneCallingCode: '+33',
      primaryPhoneCountryCode: 'FR',
    };
  }

  const internationalDigits = digits.replace(/^00/, '');

  // The server infers the country from the + prefix; without it, it rejects the number.
  if (isInternational && /^[1-9]\d{7,14}$/.test(internationalDigits)) {
    return {
      primaryPhoneNumber: `+${internationalDigits}`,
      primaryPhoneCallingCode: '',
      primaryPhoneCountryCode: '',
    };
  }

  return null;
};

export const normalizeCompanyName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export const companyNameLikePattern = (name: string): string =>
  normalizeCompanyName(name)
    .replace(/[\\%_]/g, (wildcard) => `\\${wildcard}`)
    .replace(/[aceinouy]/g, '_')
    .replace(/ /g, '%');

export const mapLeadToOpportunityData = (
  lead: SiteLead,
  links: {
    personId: string;
    companyId: string | null;
    ownerId: string | null;
    companyName: string | null;
  },
): Record<string, unknown> => {
  const need = lookUp(NEED_BY_SITE_VALUE, lead.need);
  const titleName = (links.companyName ?? lead.name).trim();

  return {
    name: `${titleName} · ${need === null ? 'Demande' : NEED_LABELS[need]}`,
    interfazeStage: 'NEW_REQUEST' satisfies InterfazeStage,
    need,
    ...(isOffer(need) ? { offer: need } : {}),
    requestSource: lookUp(REQUEST_SOURCE_BY_SITE_VALUE, lead.source),
    timing: lookUp(TIMING_BY_SITE_VALUE, lead.timing),
    requestRef: lead.ref,
    requestMessage: lead.message,
    receivedAt: lead.created_at,
    pointOfContactId: links.personId,
    companyId: links.companyId,
    ownerId: links.ownerId,
    siteLeadId: lead.id,
    siteLeadStatusSeen: lead.status,
  };
};

export const statusForStage = (stage: InterfazeStage): SiteLeadStatus =>
  STATUS_BY_STAGE[stage];

export const stageAfterSiteStatus = ({
  stage,
  seenStatus,
  siteStatus,
}: {
  stage: InterfazeStage;
  seenStatus: string | null;
  siteStatus: SiteLeadStatus;
}): { stage: InterfazeStage | null; askToClose: boolean } => {
  const seenRank =
    seenStatus !== null &&
    Object.prototype.hasOwnProperty.call(STATUS_RANK, seenStatus)
      ? STATUS_RANK[seenStatus as SiteLeadStatus]
      : STATUS_RANK.new;

  if (STATUS_RANK[siteStatus] <= seenRank) {
    return { stage: null, askToClose: false };
  }

  if (siteStatus === 'done') {
    return { stage: null, askToClose: !CLOSED_STAGES.includes(stage) };
  }

  return {
    stage:
      siteStatus === 'in_progress' && stage === 'NEW_REQUEST'
        ? 'DISCUSSION'
        : null,
    askToClose: false,
  };
};
