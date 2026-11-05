import { CoreApiClient } from 'twenty-client-sdk/core';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { toRecordApiClient } from 'src/utils/record-api-client';
import { seedPageTemplates } from 'src/utils/seed-page-templates';

const handler = async (): Promise<void> => {
  const { created } = await seedPageTemplates(
    toRecordApiClient(new CoreApiClient()),
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
  handler,
});
