import { type InstallPayload } from 'twenty-sdk/define';

import { type RecordApiClient } from 'src/utils/record-api-client';
import { seedPageTemplates } from 'src/utils/seed-page-templates';

// First app version that ships pages. Seeding is tied to the version jump
// rather than to page titles, so a template the team renamed or trashed is
// never installed again by a later upgrade.
const PAGES_FIRST_VERSION = '0.2.0';

const versionParts = (version: string) =>
  version.split('.').map((part) => Number.parseInt(part, 10) || 0);

const isOlderThan = (version: string, reference: string) => {
  const [current, target] = [versionParts(version), versionParts(reference)];

  for (let index = 0; index < 3; index += 1) {
    if ((current[index] ?? 0) !== (target[index] ?? 0)) {
      return (current[index] ?? 0) < (target[index] ?? 0);
    }
  }

  return false;
};

export const shouldSeedPages = (previousVersion: string | undefined): boolean =>
  previousVersion === undefined ||
  isOlderThan(previousVersion, PAGES_FIRST_VERSION);

export const runPagesPostInstall = async (
  client: RecordApiClient,
  payload: InstallPayload,
): Promise<{ created: string[] }> => {
  if (!shouldSeedPages(payload.previousVersion)) {
    return { created: [] };
  }

  return seedPageTemplates(client);
};
