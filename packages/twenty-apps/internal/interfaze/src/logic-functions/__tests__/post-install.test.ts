import { describe, expect, it } from 'vitest';

import postInstall from 'src/logic-functions/post-install';

describe('post-install', () => {
  it('runs synchronously, on install and on version upgrades', () => {
    expect(postInstall.success).toBe(true);
    expect(postInstall.config.shouldRunSynchronously).toBe(true);
    expect(postInstall.config.shouldRunOnVersionUpgrade).toBe(true);
  });
});
