import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handlePageEvent, type PageEvent } from 'src/utils/handle-page-event';
import { toRecordApiClient } from 'src/utils/record-api-client';

const handler = async (event: DatabaseEventPayload): Promise<void> => {
  await handlePageEvent(toRecordApiClient(new CoreApiClient()), {
    name: event.name,
    recordId: event.recordId,
    properties: event.properties as PageEvent['properties'],
  });
};

export default defineLogicFunction({
  universalIdentifier: PAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-page-changed',
  description:
    "Fait remonter d'un niveau les sous-pages d'une page mise à la corbeille, et les lui rend si elle est restaurée.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'page.*',
  },
  handler,
});
