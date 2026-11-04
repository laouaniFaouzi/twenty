import { type Offer } from 'src/constants/offer';
import { type ClientStatus } from 'src/fields/company-client-status.field';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import {
  buildProjectFromOpportunity,
  type Currency,
} from 'src/utils/build-project-from-opportunity';
import { createInternalTask } from 'src/utils/create-internal-task';
import { getEdgeNodes, type RecordApiClient } from 'src/utils/record-api-client';

export type OpportunityUpdateEvent = {
  recordId: string;
  properties: {
    before: { interfazeStage?: InterfazeStage | null };
    updatedFields: string[];
  };
};

type OpportunityForSignature = {
  id: string;
  name: string;
  interfazeStage: InterfazeStage | null;
  offer: Offer | null;
  closeDate: string | null;
  ownerId: string | null;
  amount: Currency | null;
  company: { id: string; name: string; clientStatus: ClientStatus | null } | null;
};

export const handleOpportunityUpdate = async (
  client: RecordApiClient,
  { recordId, properties }: OpportunityUpdateEvent,
  now: Date,
): Promise<void> => {
  const becameWon =
    properties.updatedFields.includes('interfazeStage') &&
    properties.before.interfazeStage !== 'WON';
  const offerChanged = properties.updatedFields.includes('offer');

  if (!becameWon && !offerChanged) {
    return;
  }

  const response = await client.query({
    opportunity: {
      __args: { filter: { id: { eq: recordId } } },
      id: true,
      name: true,
      interfazeStage: true,
      offer: true,
      closeDate: true,
      ownerId: true,
      amount: { amountMicros: true, currencyCode: true },
      company: { id: true, name: true, clientStatus: true },
    },
    projects: {
      __args: { filter: { opportunityId: { eq: recordId } }, first: 1 },
      edges: { node: { id: true } },
    },
  });

  const opportunity = response.opportunity as
    | OpportunityForSignature
    | null
    | undefined;

  if (!opportunity || opportunity.interfazeStage !== 'WON') {
    return;
  }

  if (becameWon) {
    if (!opportunity.closeDate) {
      await client.mutation({
        updateOpportunity: {
          __args: { id: opportunity.id, data: { closeDate: now.toISOString() } },
          id: true,
        },
      });
    }

    if (opportunity.company && opportunity.company.clientStatus !== 'CLIENT') {
      await client.mutation({
        updateCompany: {
          __args: { id: opportunity.company.id, data: { clientStatus: 'CLIENT' } },
          id: true,
        },
      });
    }
  }

  if (getEdgeNodes(response, 'projects').length > 0) {
    return;
  }

  if (opportunity.offer) {
    await client.mutation({
      createProject: {
        __args: {
          data: buildProjectFromOpportunity({ ...opportunity, offer: opportunity.offer }),
        },
        id: true,
      },
    });

    return;
  }

  if (becameWon) {
    await createInternalTask(client, {
      title: `Choisir l'offre de ${opportunity.name}`,
      assigneeId: opportunity.ownerId,
      dueAt: null,
      target: { objectName: 'opportunity', recordId: opportunity.id },
    });
  }
};
