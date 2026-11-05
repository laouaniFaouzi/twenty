import { describe, expect, it } from 'vitest';

import postInstall from 'src/logic-functions/post-install';

describe('post-install', () => {
  it('runs synchronously at install time', () => {
    expect(postInstall.success).toBe(true);
    expect(postInstall.config.shouldRunSynchronously).toBe(true);
  });
});
