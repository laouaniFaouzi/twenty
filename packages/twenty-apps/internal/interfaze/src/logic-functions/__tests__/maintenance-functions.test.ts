import { describe, expect, it } from 'vitest';

import createRenewalTasks from 'src/logic-functions/create-renewal-tasks';

describe('create-renewal-tasks', () => {
  it('creates renewal tasks every morning', () => {
    expect(createRenewalTasks.success).toBe(true);
    expect(createRenewalTasks.config.cronTriggerSettings).toEqual({
      pattern: '0 5 * * *',
    });
    expect(createRenewalTasks.config.timeoutSeconds).toBe(120);
  });
});
