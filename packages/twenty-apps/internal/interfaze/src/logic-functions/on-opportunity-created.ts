import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { OPPORTUNITY_CREATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { handleOpportunityCreation } from 'src/utils/handle-opportunity-update';
import { toRecordApiClient } from 'src/utils/record-api-client';

type OpportunitySnapshot = { interfazeStage?: InterfazeStage | null };

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<OpportunitySnapshot>>,
): Promise<void> => {
  await handleOpportunityCreation(
    toRecordApiClient(new CoreApiClient()),
    {
      recordId: event.recordId,
      properties: {
        after: { interfazeStage: event.properties.after?.interfazeStage },
      },
    },
    new Date(),
  );
};

export default defineLogicFunction({
  universalIdentifier: OPPORTUNITY_CREATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-opportunity-created',
  description:
    "Traite comme une signature une opportunité créée directement à l'étape Signé.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'opportunity.created',
  },
  handler,
});
