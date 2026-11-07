import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { RESPONSE_OVERDUE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { refreshResponseOverdue } from 'src/utils/refresh-response-overdue';

const handler = async () =>
  refreshResponseOverdue(toRecordApiClient(new CoreApiClient()), new Date());

export default defineLogicFunction({
  universalIdentifier: RESPONSE_OVERDUE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'refresh-response-overdue',
  description:
    "Toutes les heures, marque les demandes restées à l'étape Nouvelle demande plus de 48 h après leur réception, pour le tableau de bord, et retire la marque des autres.",
  timeoutSeconds: 60,
  cronTriggerSettings: { pattern: '0 * * * *' },
  handler,
});
