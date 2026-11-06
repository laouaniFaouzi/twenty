import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { createInternalTask } from 'src/utils/create-internal-task';
import { leadNoteTitle } from 'src/utils/handle-lead-created';
import { type SiteLead, stageAfterSiteStatus } from 'src/utils/lead-mapping';
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

const hasAnyRecord = async (
  client: RecordApiClient,
  roots: string[],
  filter: Record<string, unknown>,
): Promise<boolean> => {
  const response = await client.query(
    Object.fromEntries(
      roots.map((root) => [
        root,
        { __args: { filter, first: 1 }, edges: { node: { id: true } } },
      ]),
    ),
  );

  return roots.some((root) => getEdgeNodes(response, root).length > 0);
};

const deleteRecord = async (
  client: RecordApiClient,
  mutationName: string,
  id: string,
) => {
  await client.mutation({ [mutationName]: { __args: { id }, id: true } });
};

const deleteLeadNotes = async (client: RecordApiClient, lead: SiteLead) => {
  const response = await client.query({
    notes: {
      __args: { filter: { title: { eq: leadNoteTitle(lead.ref) } }, first: 10 },
      edges: { node: { id: true } },
    },
  });

  for (const note of getEdgeNodes<{ id: string }>(response, 'notes')) {
    await deleteRecord(client, 'deleteNote', note.id);
  }
};

export const handleLeadDeleted = async (
  client: RecordApiClient,
  lead: SiteLead,
): Promise<void> => {
  const opportunity = await findLeadOpportunity(client, lead);

  if (opportunity === null || opportunity.siteLeadId !== lead.id) {
    await deleteLeadNotes(client, lead);

    return;
  }

  // A signed opportunity now belongs to the client relationship, not to the lead.
  if (opportunity.interfazeStage === 'WON') {
    return;
  }

  await deleteRecord(client, 'deleteOpportunity', opportunity.id);

  const { pointOfContactId: personId, companyId } = opportunity;

  if (
    personId !== null &&
    !(await hasAnyRecord(client, ['opportunities'], {
      pointOfContactId: { eq: personId },
    }))
  ) {
    await deleteRecord(client, 'deletePerson', personId);
  }

  if (
    companyId !== null &&
    !(await hasAnyRecord(
      client,
      ['opportunities', 'projects', 'maintenanceContracts', 'people'],
      { companyId: { eq: companyId } },
    ))
  ) {
    await deleteRecord(client, 'deleteCompany', companyId);
  }
};
