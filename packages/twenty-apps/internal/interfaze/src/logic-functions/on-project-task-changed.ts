import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_TASK_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  handleProjectTaskEvent,
  type ProjectTaskEvent,
} from 'src/utils/handle-project-task-event';
import {
  buildTrackerSyncDependencies,
  handleTrackerSyncEvent,
} from 'src/utils/push-trackers';
import { toRecordApiClient } from 'src/utils/record-api-client';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  const client = toRecordApiClient(new CoreApiClient());
  const properties = event.properties as ProjectTaskEvent['properties'];

  await handleProjectTaskEvent(client, { name: event.name, properties });

  const syncDependencies = buildTrackerSyncDependencies(process.env);

  if (syncDependencies !== null) {
    await handleTrackerSyncEvent(
      client,
      {
        objectName: 'projectTask',
        name: event.name,
        recordId: event.recordId,
        properties: { updatedFields: properties.updatedFields },
      },
      syncDependencies,
    );
  }
};

export default defineLogicFunction({
  universalIdentifier: PROJECT_TASK_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-task-changed',
  description:
    "Recalcule l'avancement et la phase en cours du projet, rattache une tâche au projet de sa phase, et l'envoie au site.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'projectTask.*',
  },
  handler,
});
