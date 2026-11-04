import { describe, expect, it } from 'vitest';

import onOpportunityCreated from 'src/logic-functions/on-opportunity-created';

describe('on-opportunity-created', () => {
  it('listens to opportunity creations', () => {
    expect(onOpportunityCreated.success).toBe(true);
    expect(onOpportunityCreated.config.databaseEventTriggerSettings).toEqual({
      eventName: 'opportunity.created',
    });
  });
});
