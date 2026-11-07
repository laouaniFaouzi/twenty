import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { RECONCILE_SITE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { buildTrackerSyncDependencies } from 'src/utils/push-trackers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { runReconciliation } from 'src/utils/reconcile-site';
import { patchSiteLead } from 'src/utils/supabase-leads';

// Scheduled runs carry no payload; { "full": true } runs the first complete import by hand.
const handler = async (event?: { full?: boolean } | null) => {
  const trackers = buildTrackerSyncDependencies(process.env);

  if (trackers === null) {
    return { skipped: 'Synchro avec le site non configurée' };
  }

  return runReconciliation(
    toRecordApiClient(new CoreApiClient()),
    { settings: trackers.settings, patchLead: patchSiteLead, trackers },
    { now: trackers.now(), full: event?.full === true },
  );
};

export default defineLogicFunction({
  universalIdentifier: RECONCILE_SITE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reconcile-site',
  description:
    "Compare HubFaze et interfaze.fr toutes les 15 minutes (suivis, phases, tâches et demandes), répare ce qu'un appel perdu a laissé, applique la règle des 3 ans et purge le Journal de synchro.",
  timeoutSeconds: 300,
  cronTriggerSettings: { pattern: '*/15 * * * *' },
  handler,
});
