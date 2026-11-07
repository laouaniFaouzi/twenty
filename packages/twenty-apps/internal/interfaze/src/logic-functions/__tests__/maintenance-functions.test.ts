import { describe, expect, it } from 'vitest';

import createRenewalTasks from 'src/logic-functions/create-renewal-tasks';
import refreshResponseOverdue from 'src/logic-functions/refresh-response-overdue';

describe('create-renewal-tasks', () => {
  it('creates renewal tasks every morning', () => {
    expect(createRenewalTasks.success).toBe(true);
    expect(createRenewalTasks.config.cronTriggerSettings).toEqual({
      pattern: '0 5 * * *',
    });
    expect(createRenewalTasks.config.timeoutSeconds).toBe(120);
  });
});

describe('refresh-response-overdue', () => {
  it('refreshes overdue requests every hour', () => {
    expect(refreshResponseOverdue.success).toBe(true);
    expect(refreshResponseOverdue.config.cronTriggerSettings).toEqual({
      pattern: '0 * * * *',
    });
    expect(refreshResponseOverdue.config.timeoutSeconds).toBe(60);
  });
});
