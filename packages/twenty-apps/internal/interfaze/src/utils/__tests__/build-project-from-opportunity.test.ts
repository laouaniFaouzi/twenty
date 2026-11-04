import { describe, expect, it } from 'vitest';

import { buildProjectFromOpportunity } from 'src/utils/build-project-from-opportunity';

const OPPORTUNITY = {
  id: 'opportunity-1',
  name: 'Refonte du site',
  offer: 'WEB' as const,
  ownerId: 'member-1',
  amount: { amountMicros: 4_800_000_000, currencyCode: 'EUR' },
  company: { id: 'company-1', name: 'Boulangerie Martin' },
};

describe('buildProjectFromOpportunity', () => {
  it('names the project after the company and the offer', () => {
    expect(buildProjectFromOpportunity(OPPORTUNITY)).toEqual({
      name: 'Boulangerie Martin · WebFaze',
      offer: 'WEB',
      status: 'IN_PROGRESS',
      opportunityId: 'opportunity-1',
      companyId: 'company-1',
      ownerId: 'member-1',
      price: { amountMicros: 4_800_000_000, currencyCode: 'EUR' },
    });
  });

  it('names the project after the opportunity when there is no company', () => {
    expect(
      buildProjectFromOpportunity({ ...OPPORTUNITY, offer: 'SMART', company: null, amount: null }),
    ).toMatchObject({
      name: 'Refonte du site · SmartFaze',
      companyId: null,
      price: null,
    });
  });
});
