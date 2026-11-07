import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { createInternalTask } from 'src/utils/create-internal-task';
import {
  buildLeadNoteMarkdown,
  companyNameLikePattern,
  escapeLikeWildcards,
  mapLeadToOpportunityData,
  normalizeCompanyName,
  normalizeFrenchPhone,
  type SiteLead,
  splitPersonName,
} from 'src/utils/lead-mapping';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';
import { type patchSiteLead } from 'src/utils/supabase-leads';
import { type SyncSettings } from 'src/utils/sync-settings';

export type LeadSyncDependencies = {
  settings: SyncSettings;
  patchLead: typeof patchSiteLead;
};

export type LeadCreatedResult = {
  outcome: 'created' | 'noted' | 'duplicate';
  opportunityId: string | null;
};

type CompanySummary = { id: string; name: string | null };

type PersonSummary = {
  id: string;
  companyId: string | null;
  company: CompanySummary | null;
};

type NoteSummary = {
  id: string;
  noteTargets: { edges: { node: { targetOpportunityId: string | null } }[] };
};

const OPEN_STAGES: InterfazeStage[] = [
  'NEW_REQUEST',
  'DISCUSSION',
  'QUOTE_SENT',
];

const REPLY_DELAY_IN_MILLISECONDS = 48 * 60 * 60 * 1000;

export const leadNoteTitle = (ref: string) => `Nouvelle demande ${ref}`;

export const REPLY_TASK_TITLE_PREFIX = 'Répondre à ';

export const replyTaskTitle = (lead: Pick<SiteLead, 'name' | 'ref'>) =>
  `${REPLY_TASK_TITLE_PREFIX}${lead.name.trim()} · ${lead.ref}`;

const replyDueAt = (createdAt: string): string | null => {
  const receivedAt = Date.parse(createdAt);

  return Number.isNaN(receivedAt)
    ? null
    : new Date(receivedAt + REPLY_DELAY_IN_MILLISECONDS).toISOString();
};

const createdId = (response: Record<string, unknown>, mutationName: string) =>
  (response[mutationName] as { id: string }).id;

export const findMemberIdByEmail = async (
  client: RecordApiClient,
  email: string | null,
): Promise<string | null> => {
  const trimmedEmail = email?.trim();

  if (!trimmedEmail) {
    return null;
  }

  const response = await client.query({
    workspaceMembers: {
      __args: {
        filter: { userEmail: { ilike: escapeLikeWildcards(trimmedEmail) } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  });

  return (
    getEdgeNodes<{ id: string }>(response, 'workspaceMembers')[0]?.id ?? null
  );
};

type ExistingRecord =
  | { kind: 'opportunity'; opportunityId: string; personId: string | null }
  | { kind: 'note'; noteId: string; opportunityId: string | null };

const findExistingRecord = async (
  client: RecordApiClient,
  lead: SiteLead,
): Promise<ExistingRecord | null> => {
  const response = await client.query({
    opportunities: {
      __args: { filter: { siteLeadId: { eq: lead.id } }, first: 1 },
      edges: { node: { id: true, pointOfContactId: true } },
    },
    notes: {
      __args: { filter: { title: { eq: leadNoteTitle(lead.ref) } }, first: 1 },
      edges: {
        node: {
          id: true,
          noteTargets: {
            edges: { node: { id: true, targetOpportunityId: true } },
          },
        },
      },
    },
  });

  const opportunity = getEdgeNodes<{
    id: string;
    pointOfContactId: string | null;
  }>(response, 'opportunities')[0];

  if (opportunity !== undefined) {
    return {
      kind: 'opportunity',
      opportunityId: opportunity.id,
      personId: opportunity.pointOfContactId ?? null,
    };
  }

  const note = getEdgeNodes<NoteSummary>(response, 'notes')[0];

  if (note === undefined) {
    return null;
  }

  const opportunityId =
    note.noteTargets.edges
      .map(({ node }) => node.targetOpportunityId)
      .find((targetId) => targetId !== null) ?? null;

  return { kind: 'note', noteId: note.id, opportunityId };
};

const findPersonByEmail = async (
  client: RecordApiClient,
  email: string,
): Promise<PersonSummary | null> => {
  const response = await client.query({
    people: {
      __args: {
        filter: {
          emails: { primaryEmail: { ilike: escapeLikeWildcards(email) } },
        },
        first: 1,
      },
      edges: {
        node: { id: true, companyId: true, company: { id: true, name: true } },
      },
    },
  });

  return getEdgeNodes<PersonSummary>(response, 'people')[0] ?? null;
};

export const findOrCreateCompany = async (
  client: RecordApiClient,
  typedName: string,
  clientStatus: 'PROSPECT' | 'CLIENT',
): Promise<{ id: string; name: string; created: boolean }> => {
  const name = typedName.trim().replace(/\s+/g, ' ');
  const response = await client.query({
    companies: {
      __args: {
        filter: { name: { ilike: `%${companyNameLikePattern(name)}%` } },
        first: 100,
      },
      edges: { node: { id: true, name: true } },
    },
  });

  const wantedName = normalizeCompanyName(name);
  const match = getEdgeNodes<CompanySummary>(response, 'companies').find(
    (company) => normalizeCompanyName(company.name ?? '') === wantedName,
  );

  if (match !== undefined) {
    return { id: match.id, name: (match.name ?? name).trim(), created: false };
  }

  const created = await client.mutation({
    createCompany: {
      __args: { data: { name, clientStatus } },
      id: true,
    },
  });

  return { id: createdId(created, 'createCompany'), name, created: true };
};

const createPerson = async (
  client: RecordApiClient,
  lead: SiteLead,
  email: string,
  companyId: string | null,
): Promise<string> => {
  const data = {
    name: splitPersonName(lead.name),
    emails: { primaryEmail: email },
    ...(companyId === null ? {} : { companyId }),
  };
  const phones = normalizeFrenchPhone(lead.phone);
  const create = async (personData: Record<string, unknown>) =>
    createdId(
      await client.mutation({
        // The email is unique even in the trash: upsert restores that person instead of failing.
        createPerson: { __args: { data: personData, upsert: true }, id: true },
      }),
      'createPerson',
    );

  if (phones === null) {
    return create(data);
  }

  try {
    return await create({ ...data, phones });
  } catch {
    // A phone the server cannot parse must not lose the lead; it stays on the site.
    return create(data);
  }
};

const findOpenOpportunityId = async (
  client: RecordApiClient,
  personId: string,
): Promise<string | null> => {
  const response = await client.query({
    opportunities: {
      __args: {
        filter: {
          pointOfContactId: { eq: personId },
          interfazeStage: { in: OPEN_STAGES },
        },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  });

  return getEdgeNodes<{ id: string }>(response, 'opportunities')[0]?.id ?? null;
};

const addLeadNote = async (
  client: RecordApiClient,
  lead: SiteLead,
  opportunityId: string,
  existingNoteId: string | null,
) => {
  const noteId =
    existingNoteId ??
    createdId(
      await client.mutation({
        createNote: {
          __args: {
            data: {
              title: leadNoteTitle(lead.ref),
              bodyV2: {
                markdown: buildLeadNoteMarkdown(lead),
                blocknote: null,
              },
            },
          },
          id: true,
        },
      }),
      'createNote',
    );

  await client.mutation({
    createNoteTarget: {
      __args: { data: { noteId, targetOpportunityId: opportunityId } },
      id: true,
    },
  });
};

// Any reply task for this lead, even done, means an earlier run already got that far.
const createReplyTask = async (
  client: RecordApiClient,
  lead: SiteLead,
  {
    ownerId,
    opportunityId,
    personId,
  }: { ownerId: string | null; opportunityId: string; personId: string | null },
) =>
  createInternalTask(client, {
    title: replyTaskTitle(lead),
    assigneeId: ownerId,
    dueAt: replyDueAt(lead.created_at),
    target: { objectName: 'opportunity', recordId: opportunityId },
    extraTargets:
      personId === null ? [] : [{ objectName: 'person', recordId: personId }],
    duplicateCheck: 'any',
  });

export const handleLeadCreated = async (
  client: RecordApiClient,
  lead: SiteLead,
  { settings, patchLead }: LeadSyncDependencies,
): Promise<LeadCreatedResult> => {
  const existing = await findExistingRecord(client, lead);
  const email = lead.email.trim();

  if (existing?.kind === 'opportunity') {
    await createReplyTask(client, lead, {
      ownerId: await findMemberIdByEmail(client, settings.leadOwnerEmail),
      opportunityId: existing.opportunityId,
      personId: existing.personId,
    });

    if (lead.crm_id !== existing.opportunityId) {
      await patchLead(settings, lead.id, { crm_id: existing.opportunityId });
    }

    return { outcome: 'duplicate', opportunityId: existing.opportunityId };
  }

  if (existing?.kind === 'note' && existing.opportunityId !== null) {
    await createReplyTask(client, lead, {
      ownerId: await findMemberIdByEmail(client, settings.leadOwnerEmail),
      opportunityId: existing.opportunityId,
      personId: (await findPersonByEmail(client, email))?.id ?? null,
    });

    return { outcome: 'duplicate', opportunityId: existing.opportunityId };
  }

  const person = await findPersonByEmail(client, email);
  const typedCompanyName = lead.company?.trim() ?? '';
  const company =
    typedCompanyName !== ''
      ? await findOrCreateCompany(client, typedCompanyName, 'PROSPECT')
      : person?.company
        ? { id: person.company.id, name: (person.company.name ?? '').trim() }
        : null;

  let personId: string;

  if (person === null) {
    personId = await createPerson(client, lead, email, company?.id ?? null);
  } else {
    personId = person.id;

    if (person.companyId === null && company !== null) {
      await client.mutation({
        updatePerson: {
          __args: { id: person.id, data: { companyId: company.id } },
          id: true,
        },
      });
    }
  }

  const ownerId = await findMemberIdByEmail(client, settings.leadOwnerEmail);
  const openOpportunityId =
    person === null ? null : await findOpenOpportunityId(client, personId);

  let opportunityId: string;

  if (openOpportunityId !== null) {
    opportunityId = openOpportunityId;
    await addLeadNote(
      client,
      lead,
      opportunityId,
      existing?.kind === 'note' ? existing.noteId : null,
    );
  } else {
    const created = await client.mutation({
      createOpportunity: {
        __args: {
          data: mapLeadToOpportunityData(lead, {
            personId,
            companyId: company?.id ?? null,
            ownerId,
            companyName: company?.name || null,
          }),
        },
        id: true,
      },
    });

    opportunityId = createdId(created, 'createOpportunity');
  }

  await createReplyTask(client, lead, { ownerId, opportunityId, personId });

  if (openOpportunityId !== null) {
    // crm_id is unique on the site and already points this opportunity to the first lead.
    return { outcome: 'noted', opportunityId };
  }

  await patchLead(settings, lead.id, { crm_id: opportunityId });

  return { outcome: 'created', opportunityId };
};
