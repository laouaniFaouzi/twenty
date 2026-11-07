import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PROJECT_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleProjectLaunch } from 'src/utils/handle-project-launch';
import {
  buildTrackerSyncDependencies,
  handleTrackerSyncEvent,
} from 'src/utils/push-trackers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { handleProjectEvent } from 'src/utils/seed-project-template';
import { readLeadOwnerEmail } from 'src/utils/sync-settings';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  const client = toRecordApiClient(new CoreApiClient());
  // Only update events carry updatedFields.
  const updatedFields =
    'updatedFields' in event.properties
      ? event.properties.updatedFields
      : undefined;

  const projectEvent = {
    name: event.name,
    recordId: event.recordId,
    properties: { updatedFields },
  };

  // The template comes first, so the tracker sent next carries its phases and tasks.
  await handleProjectEvent(client, projectEvent);
  await handleProjectLaunch(client, projectEvent, {
    leadOwnerEmail: readLeadOwnerEmail(process.env),
  });

  const syncDependencies = buildTrackerSyncDependencies(process.env);

  if (syncDependencies !== null) {
    await handleTrackerSyncEvent(
      client,
      {
        objectName: 'project',
        name: event.name,
        recordId: event.recordId,
        properties: {
          updatedFields,
          before:
            'before' in event.properties
              ? (event.properties.before as { siteTrackerId?: string | null })
              : undefined,
        },
      },
      syncDependencies,
    );
  }
};

export default defineLogicFunction({
  universalIdentifier: PROJECT_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-project-changed',
  description:
    "Crée les phases et tâches modèles de l'offre quand un projet est créé ou reçoit une offre, passe le projet en Mis en ligne et propose un contrat de maintenance quand la mise en ligne réelle est renseignée, puis envoie le suivi au site.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'project.*',
  },
  handler,
});
