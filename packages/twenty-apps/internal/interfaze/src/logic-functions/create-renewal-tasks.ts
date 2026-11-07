import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { RENEWAL_TASKS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createRenewalTasks } from 'src/utils/create-renewal-tasks';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { readLeadOwnerEmail } from 'src/utils/sync-settings';

const handler = async () =>
  createRenewalTasks(toRecordApiClient(new CoreApiClient()), {
    now: new Date(),
    leadOwnerEmail: readLeadOwnerEmail(process.env),
  });

export default defineLogicFunction({
  universalIdentifier: RENEWAL_TASKS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'create-renewal-tasks',
  description:
    'Chaque matin, crée « Renouveler le contrat … » pour chaque contrat actif qui se renouvelle dans les 30 jours ou en retard, une seule fois par date de renouvellement.',
  timeoutSeconds: 120,
  // Twenty runs crons in UTC: 5:00 is 7:00 in Paris in summer and 6:00 in winter, before the day starts.
  cronTriggerSettings: { pattern: '0 5 * * *' },
  handler,
});
