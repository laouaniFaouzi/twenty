import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type ObjectRecordDeleteEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handlePageEvent } from 'src/utils/handle-page-event';
import { toRecordApiClient } from 'src/utils/record-api-client';

type PageSnapshot = { parentPageId?: string | null };

const handler = async (
  event: DatabaseEventPayload<ObjectRecordDeleteEvent<PageSnapshot>>,
): Promise<void> => {
  await handlePageEvent(toRecordApiClient(new CoreApiClient()), {
    name: event.name,
    recordId: event.recordId,
    properties: {
      before: { parentPageId: event.properties.before?.parentPageId ?? null },
    },
  });
};

export default defineLogicFunction({
  universalIdentifier: PAGE_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-page-changed',
  description:
    "Fait remonter d'un niveau les sous-pages d'une page mise à la corbeille.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'page.deleted',
  },
  handler,
});
