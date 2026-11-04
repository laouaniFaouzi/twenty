import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { OPPORTUNITY_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { handleOpportunityUpdate } from 'src/utils/handle-opportunity-update';
import { toRecordApiClient } from 'src/utils/record-api-client';

type OpportunitySnapshot = { interfazeStage?: InterfazeStage | null };

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<OpportunitySnapshot>>,
): Promise<void> => {
  await handleOpportunityUpdate(
    toRecordApiClient(new CoreApiClient()),
    {
      recordId: event.recordId,
      properties: {
        before: { interfazeStage: event.properties.before?.interfazeStage },
        updatedFields: event.properties.updatedFields ?? [],
      },
    },
    new Date(),
  );
};

export default defineLogicFunction({
  universalIdentifier: OPPORTUNITY_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-opportunity-updated',
  description:
    "À la signature d'une opportunité : date de signature, société cliente et création du projet (ou tâche « Choisir l'offre »).",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'opportunity.updated',
    updatedFields: ['interfazeStage', 'offer'],
  },
  handler,
});
