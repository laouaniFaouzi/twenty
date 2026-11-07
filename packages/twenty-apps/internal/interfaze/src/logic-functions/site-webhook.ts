import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SITE_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleSiteWebhook } from 'src/utils/handle-site-webhook';
import { buildTrackerSyncDependencies } from 'src/utils/push-trackers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { patchSiteLead } from 'src/utils/supabase-leads';

const httpResponse = (status: number, message: string) => ({
  __twentyHttpResponse: true as const,
  status,
  body: { message },
});

const handler = async (event: RoutePayload) => {
  const trackers = buildTrackerSyncDependencies(process.env);

  if (trackers === null) {
    return httpResponse(503, 'Synchro avec le site non configurée');
  }

  const { status, message } = await handleSiteWebhook(
    toRecordApiClient(new CoreApiClient()),
    { secret: event.headers['x-hubfaze-secret'], body: event.body },
    { settings: trackers.settings, patchLead: patchSiteLead, trackers },
  );

  return httpResponse(status, message);
};

export default defineLogicFunction({
  universalIdentifier: SITE_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'site-webhook',
  description:
    'Reçoit les demandes et les suivis créés, modifiés ou supprimés sur interfaze.fr (trigger pg_net du site) et les applique dans HubFaze.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: '/hubfaze/site-webhook',
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: ['x-hubfaze-secret'],
  },
  handler,
});
