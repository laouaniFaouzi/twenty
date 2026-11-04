import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_TASK_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  handleProjectTaskEvent,
  type ProjectTaskEvent,
} from 'src/utils/handle-project-task-event';
import { toRecordApiClient } from 'src/utils/record-api-client';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  await handleProjectTaskEvent(toRecordApiClient(new CoreApiClient()), {
    name: event.name,
    properties: event.properties as ProjectTaskEvent['properties'],
  });
};

export default defineLogicFunction({
  universalIdentifier: PROJECT_TASK_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-task-changed',
  description:
    "Recalcule l'avancement et la phase en cours du projet, et rattache une tâche au projet de sa phase.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'projectTask.*',
  },
  handler,
});
