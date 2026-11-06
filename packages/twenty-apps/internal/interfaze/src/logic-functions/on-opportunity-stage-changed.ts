import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { OPPORTUNITY_STAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { handleOpportunityStageChange } from 'src/utils/handle-opportunity-stage-change';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { patchSiteLead } from 'src/utils/supabase-leads';
import { readSyncSettings } from 'src/utils/sync-settings';

type OpportunitySnapshot = {
  interfazeStage?: InterfazeStage | null;
  siteLeadId?: string | null;
  siteLeadStatusSeen?: string | null;
};

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<OpportunitySnapshot>>,
): Promise<void> => {
  const settingsResult = readSyncSettings(process.env);

  await handleOpportunityStageChange(
    toRecordApiClient(new CoreApiClient()),
    {
      recordId: event.recordId,
      properties: {
        before: { interfazeStage: event.properties.before?.interfazeStage },
        after: {
          interfazeStage: event.properties.after?.interfazeStage,
          siteLeadId: event.properties.after?.siteLeadId,
          siteLeadStatusSeen: event.properties.after?.siteLeadStatusSeen,
        },
      },
    },
    {
      settings: settingsResult.success ? settingsResult.settings : null,
      patchLead: patchSiteLead,
    },
  );
};

export default defineLogicFunction({
  universalIdentifier:
    OPPORTUNITY_STAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-opportunity-stage-changed',
  description:
    "Renvoie l'étape d'une opportunité vers le statut de sa demande sur interfaze.fr, et clôt la tâche « Répondre à … » quand elle quitte Nouvelle demande.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'opportunity.updated',
    updatedFields: ['interfazeStage'],
  },
  handler,
});
