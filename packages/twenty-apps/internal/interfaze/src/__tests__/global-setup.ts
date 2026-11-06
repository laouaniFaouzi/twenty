import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { appDevOnce, appUninstall } from 'twenty-sdk/cli';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const APP_PATH = process.cwd();
const CONFIG_DIR = path.join(os.homedir(), '.twenty');

function validateEnv(): { apiUrl: string; apiKey: string } {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'TWENTY_API_URL and TWENTY_API_KEY must be set.\n' +
        'Start a local server: yarn twenty docker:start\n' +
        'Or set them in vitest env config.',
    );
  }

  return { apiUrl, apiKey };
}

async function checkServer(apiUrl: string) {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/healthz`);
  } catch {
    throw new Error(
      `Twenty server is not reachable at ${apiUrl}. ` +
        'Make sure the server is running before executing integration tests.',
    );
  }

  if (!response.ok) {
    throw new Error(`Server at ${apiUrl} returned ${response.status}`);
  }
}

function writeConfig(apiUrl: string, apiKey: string) {
  const payload = JSON.stringify(
    {
      remotes: {
        local: { apiUrl, apiKey, accessToken: apiKey },
      },
      defaultRemote: 'local',
    },
    null,
    2,
  );

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONFIG_DIR, 'config.test.json'), payload);
}

export async function setup() {
  const { apiUrl, apiKey } = validateEnv();

  await checkServer(apiUrl);

  writeConfig(apiUrl, apiKey);

  await appUninstall({ appPath: APP_PATH }).catch(() => {});

  const result = await appDevOnce({
    appPath: APP_PATH,
    onProgress: (message: string) => console.log(`[dev] ${message}`),
  });

  if (!result.success) {
    throw new Error(
      `Dev sync failed: ${result.error?.message ?? 'Unknown error'}`,
    );
  }

  await setSiteSyncVariables();
}

// The site leads test only runs against a site database; without one the app keeps empty variables.
async function setSiteSyncVariables() {
  if (!process.env.SUPABASE_URL) {
    return;
  }

  const variables: Record<string, string> = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? '',
    HUBFAZE_WEBHOOK_SECRET: process.env.HUBFAZE_WEBHOOK_SECRET ?? '',
    LEAD_OWNER_EMAIL: process.env.LEAD_OWNER_EMAIL ?? 'tim@apple.dev',
  };
  const metadataClient = new MetadataApiClient();
  const { findOneApplication } = await metadataClient.query({
    findOneApplication: {
      __args: { universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER },
      id: true,
    },
  });

  for (const [key, value] of Object.entries(variables)) {
    await metadataClient.mutation({
      updateOneApplicationVariable: {
        __args: { key, value, applicationId: findOneApplication.id },
      },
    });
  }
}

export async function teardown() {
  const uninstallResult = await appUninstall({ appPath: APP_PATH });

  if (!uninstallResult.success) {
    console.warn(
      `App uninstall failed: ${uninstallResult.error?.message ?? 'Unknown error'}`,
    );
  }
}
