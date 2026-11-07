import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { createInternalTask } from 'src/utils/create-internal-task';
import {
  leadNoteTitle,
  REPLY_TASK_TITLE_PREFIX,
} from 'src/utils/handle-lead-created';
import {
  escapeLikeWildcards,
  type SiteLead,
  stageAfterSiteStatus,
} from 'src/utils/lead-mapping';
import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';

export type LeadOpportunity = {
  id: string;
  name: string;
  interfazeStage: InterfazeStage;
  siteLeadId: string | null;
  siteLeadStatusSeen: string | null;
  ownerId: string | null;
  pointOfContactId: string | null;
  companyId: string | null;
};

const LEAD_OPPORTUNITY_SELECTION = {
  id: true,
  name: true,
  interfazeStage: true,
  siteLeadId: true,
  siteLeadStatusSeen: true,
  ownerId: true,
  pointOfContactId: true,
  companyId: true,
};

const closeOnSiteTaskTitle = (ref: string) =>
  `Demande ${ref} clôturée sur le site : passer en Signé ou Perdu`;

export const findLeadOpportunity = async (
  client: RecordApiClient,
  lead: Pick<SiteLead, 'id' | 'crm_id'>,
): Promise<LeadOpportunity | null> => {
  const bySiteLeadId = { siteLeadId: { eq: lead.id } };
  const response = await client.query({
    opportunities: {
      __args: {
        filter:
          lead.crm_id === null
            ? bySiteLeadId
            : { or: [{ id: { eq: lead.crm_id } }, bySiteLeadId] },
        first: 2,
      },
      edges: { node: LEAD_OPPORTUNITY_SELECTION },
    },
  });

  const candidates = getEdgeNodes<LeadOpportunity>(response, 'opportunities');

  return (
    candidates.find((candidate) => candidate.id === lead.crm_id) ??
    candidates[0] ??
    null
  );
};

export const handleLeadUpdated = async (
  client: RecordApiClient,
  lead: SiteLead,
): Promise<void> => {
  const opportunity = await findLeadOpportunity(client, lead);

  if (opportunity === null || opportunity.siteLeadStatusSeen === lead.status) {
    return;
  }

  const { stage, askToClose } = stageAfterSiteStatus({
    stage: opportunity.interfazeStage,
    seenStatus: opportunity.siteLeadStatusSeen,
    siteStatus: lead.status,
  });

  await client.mutation({
    updateOpportunity: {
      __args: {
        id: opportunity.id,
        data: {
          siteLeadStatusSeen: lead.status,
          ...(stage === null ? {} : { interfazeStage: stage }),
        },
      },
      id: true,
    },
  });

  if (askToClose) {
    await createInternalTask(client, {
      title: closeOnSiteTaskTitle(lead.ref),
      assigneeId: opportunity.ownerId,
      dueAt: null,
      target: { objectName: 'opportunity', recordId: opportunity.id },
    });
  }
};

const CLIENT_STATUSES = ['CLIENT', 'FORMER_CLIENT'];

const firstRecords = (filter: Record<string, unknown>) => ({
  __args: { filter, first: 1 },
  edges: { node: { id: true } },
});

const hasOtherOpportunity = async (client: RecordApiClient, personId: string) =>
  getEdgeNodes(
    await client.query({
      opportunities: firstRecords({ pointOfContactId: { eq: personId } }),
    }),
    'opportunities',
  ).length > 0;

// A client relationship (spec §5.3, §13) keeps the company and its contacts beyond the lead purge.
const readCompanyLinks = async (client: RecordApiClient, companyId: string) => {
  const byCompany = { companyId: { eq: companyId } };
  const response = await client.query({
    companies: {
      __args: { filter: { id: { eq: companyId } }, first: 1 },
      edges: { node: { id: true, clientStatus: true } },
    },
    projects: firstRecords(byCompany),
    maintenanceContracts: firstRecords(byCompany),
    opportunities: firstRecords(byCompany),
    people: firstRecords(byCompany),
  });
  const hasAny = (root: string) => getEdgeNodes(response, root).length > 0;
  const clientStatus =
    getEdgeNodes<{ clientStatus: string | null }>(response, 'companies')[0]
      ?.clientStatus ?? null;

  return {
    isClient:
      CLIENT_STATUSES.includes(clientStatus ?? '') ||
      hasAny('projects') ||
      hasAny('maintenanceContracts'),
    hasOpportunitiesOrPeople: hasAny('opportunities') || hasAny('people'),
  };
};

const findPersonCompanyId = async (
  client: RecordApiClient,
  personId: string,
): Promise<string | null> =>
  getEdgeNodes<{ companyId: string | null }>(
    await client.query({
      people: {
        __args: { filter: { id: { eq: personId } }, first: 1 },
        edges: { node: { id: true, companyId: true } },
      },
    }),
    'people',
  )[0]?.companyId ?? null;

const deleteRecord = async (
  client: RecordApiClient,
  mutationName: string,
  id: string,
) => {
  await client.mutation({ [mutationName]: { __args: { id }, id: true } });
};

const deleteRecordsByTitle = async (
  client: RecordApiClient,
  {
    root,
    mutationName,
    titles,
  }: { root: 'notes' | 'tasks'; mutationName: string; titles: string[] },
) => {
  const response = await client.query({
    [root]: {
      __args: {
        filter: {
          title: titles.length === 1 ? { eq: titles[0] } : { in: titles },
        },
        first: 20,
      },
      edges: { node: { id: true } },
    },
  });

  for (const { id } of getEdgeNodes<{ id: string }>(response, root)) {
    await deleteRecord(client, mutationName, id);
  }
};

export type PurgedLead = Pick<SiteLead, 'id' | 'ref' | 'crm_id'>;

// The purge keeps a privacy promise: the app's own tasks carry the prospect's name.
// They are found by reference, so a lead rebuilt from its opportunity (no name) is purged too.
const deleteLeadTasks = async (client: RecordApiClient, ref: string) => {
  const response = await client.query({
    tasks: {
      __args: {
        filter: {
          or: [
            {
              title: {
                ilike: `${REPLY_TASK_TITLE_PREFIX}% · ${escapeLikeWildcards(ref)}`,
              },
            },
            { title: { eq: closeOnSiteTaskTitle(ref) } },
          ],
        },
        first: 20,
      },
      edges: { node: { id: true } },
    },
  });

  for (const { id } of getEdgeNodes<{ id: string }>(response, 'tasks')) {
    await deleteRecord(client, 'deleteTask', id);
  }
};

export const handleLeadDeleted = async (
  client: RecordApiClient,
  lead: PurgedLead,
): Promise<void> => {
  const opportunity = await findLeadOpportunity(client, lead);

  if (opportunity === null || opportunity.siteLeadId !== lead.id) {
    await deleteRecordsByTitle(client, {
      root: 'notes',
      mutationName: 'deleteNote',
      titles: [leadNoteTitle(lead.ref)],
    });
    await deleteLeadTasks(client, lead.ref);

    return;
  }

  // A signed opportunity now belongs to the client relationship, not to the lead.
  if (opportunity.interfazeStage === 'WON') {
    return;
  }

  await deleteRecord(client, 'deleteOpportunity', opportunity.id);
  await deleteLeadTasks(client, lead.ref);

  const { pointOfContactId: personId, companyId } = opportunity;

  if (personId !== null) {
    const personCompanyId = await findPersonCompanyId(client, personId);
    const isClientContact =
      personCompanyId !== null &&
      (await readCompanyLinks(client, personCompanyId)).isClient;

    if (!isClientContact && !(await hasOtherOpportunity(client, personId))) {
      await deleteRecord(client, 'deletePerson', personId);
    }
  }

  if (companyId !== null) {
    const links = await readCompanyLinks(client, companyId);

    if (!links.isClient && !links.hasOpportunitiesOrPeople) {
      await deleteRecord(client, 'deleteCompany', companyId);
    }
  }
};
