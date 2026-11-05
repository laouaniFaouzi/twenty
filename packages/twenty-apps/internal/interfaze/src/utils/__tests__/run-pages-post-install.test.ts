import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { runPagesPostInstall, shouldSeedPages } from 'src/utils/run-pages-post-install';

let client: MockRecordApiClient;

beforeEach(() => {
  client = createMockRecordApiClient();
  client.query.mockResolvedValue({ pages: connection([]) });
  client.mutation.mockResolvedValue({ createPage: { id: 'new' } });
});

describe('shouldSeedPages', () => {
  it('seeds on a fresh install and on upgrades from before pages existed', () => {
    expect(shouldSeedPages(undefined)).toBe(true);
    expect(shouldSeedPages('0.1.0')).toBe(true);
    expect(shouldSeedPages('0.1.9')).toBe(true);
  });

  it('never seeds again once a version with pages was installed', () => {
    expect(shouldSeedPages('0.2.0')).toBe(false);
    expect(shouldSeedPages('0.10.0')).toBe(false);
    expect(shouldSeedPages('1.0.0')).toBe(false);
  });
});

describe('runPagesPostInstall', () => {
  it('seeds the pages when upgrading from lot 1', async () => {
    const result = await runPagesPostInstall(client, { previousVersion: '0.1.0', newVersion: '0.2.0' });

    expect(result.created).toHaveLength(5);
  });

  it('leaves pages alone on later upgrades, even renamed or trashed ones', async () => {
    const result = await runPagesPostInstall(client, { previousVersion: '0.2.0', newVersion: '0.3.0' });

    expect(result.created).toEqual([]);
    expect(client.query).not.toHaveBeenCalled();
    expect(client.mutation).not.toHaveBeenCalled();
  });
});
