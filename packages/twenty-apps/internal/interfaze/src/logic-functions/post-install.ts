import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  definePostInstallLogicFunction,
  type InstallPayload,
} from 'twenty-sdk/define';

import { POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { runPagesPostInstall } from 'src/utils/run-pages-post-install';

const handler = async (payload: InstallPayload): Promise<void> => {
  const { created } = await runPagesPostInstall(
    toRecordApiClient(new CoreApiClient()),
    payload,
  );

  console.log('[interfaze] Pages installées', created);
};

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description:
    "Installe les modèles de pages et la page d'aide des bases de données, une seule fois.",
  timeoutSeconds: 60,
  shouldRunSynchronously: true,
  // An app already installed before pages existed gets them on upgrade.
  shouldRunOnVersionUpgrade: true,
  handler,
});
