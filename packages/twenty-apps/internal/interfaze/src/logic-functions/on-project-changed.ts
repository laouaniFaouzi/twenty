import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { handleProjectEvent } from 'src/utils/seed-project-template';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  await handleProjectEvent(toRecordApiClient(new CoreApiClient()), {
    name: event.name,
    recordId: event.recordId,
    properties: { updatedFields: event.properties.updatedFields },
  });
};

export default defineLogicFunction({
  universalIdentifier: PROJECT_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-changed',
  description:
    "Crée les phases et tâches modèles de l'offre quand un projet est créé ou reçoit une offre.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'project.*',
  },
  handler,
});
