import { CoreApiClient } from 'twenty-client-sdk/core';

import { setup, teardown } from '../src/__tests__/global-setup';
import { toRecordApiClient } from '../src/utils/record-api-client';
import { seedPageTemplates } from '../src/utils/seed-page-templates';

// Installs the app like the integration tests do. A dev sync skips the
// post-install hook, so its seeding is run here.
const globalSetup = async () => {
  // The CLI reads ~/.twenty/config.test.json, the file setup() writes, only
  // when NODE_ENV is test; Vitest sets it, Playwright does not.
  process.env.NODE_ENV = 'test';
  await setup();
  await seedPageTemplates(toRecordApiClient(new CoreApiClient()));

  return teardown;
};

export default globalSetup;
