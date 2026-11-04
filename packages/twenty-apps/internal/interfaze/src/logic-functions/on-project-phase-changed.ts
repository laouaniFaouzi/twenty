import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_PHASE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  handleProjectPhaseEvent,
  type ProjectPhaseEvent,
} from 'src/utils/handle-project-phase-event';
import { toRecordApiClient } from 'src/utils/record-api-client';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  await handleProjectPhaseEvent(toRecordApiClient(new CoreApiClient()), {
    name: event.name,
    recordId: event.recordId,
    properties: event.properties as ProjectPhaseEvent['properties'],
  });
};

export default defineLogicFunction({
  universalIdentifier: PROJECT_PHASE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-phase-changed',
  description:
    "Recalcule la phase en cours d'un projet quand une phase est créée, renommée, déplacée ou supprimée.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'projectPhase.*',
  },
  handler,
});
