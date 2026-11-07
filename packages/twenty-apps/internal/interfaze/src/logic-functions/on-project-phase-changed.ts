import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_PHASE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  handleProjectPhaseEvent,
  type ProjectPhaseEvent,
} from 'src/utils/handle-project-phase-event';
import {
  buildTrackerSyncDependencies,
  handleTrackerSyncEvent,
} from 'src/utils/push-trackers';
import { toRecordApiClient } from 'src/utils/record-api-client';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  const client = toRecordApiClient(new CoreApiClient());
  const properties = event.properties as ProjectPhaseEvent['properties'];

  await handleProjectPhaseEvent(client, {
    name: event.name,
    recordId: event.recordId,
    properties,
  });

  const syncDependencies = buildTrackerSyncDependencies(process.env);

  if (syncDependencies !== null) {
    await handleTrackerSyncEvent(
      client,
      {
        objectName: 'projectPhase',
        name: event.name,
        recordId: event.recordId,
        properties: { updatedFields: properties.updatedFields },
      },
      syncDependencies,
    );
  }
};

export default defineLogicFunction({
  universalIdentifier:
    PROJECT_PHASE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-phase-changed',
  description:
    "Recalcule la phase en cours d'un projet quand une phase est créée, renommée, déplacée ou supprimée, et l'envoie au site.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'projectPhase.*',
  },
  handler,
});
