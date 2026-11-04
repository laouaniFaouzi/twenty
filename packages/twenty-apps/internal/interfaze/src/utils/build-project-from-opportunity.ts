import { type Offer, OFFER_LABELS } from 'src/constants/offer';

export type Currency = { amountMicros: number; currencyCode: string };

export type OpportunityForProject = {
  id: string;
  name: string;
  offer: Offer;
  ownerId: string | null;
  amount: Currency | null;
  company: { id: string; name: string } | null;
};

export const buildProjectFromOpportunity = (
  opportunity: OpportunityForProject,
): Record<string, unknown> => ({
  name: `${opportunity.company?.name ?? opportunity.name} · ${OFFER_LABELS[opportunity.offer]}`,
  offer: opportunity.offer,
  status: 'IN_PROGRESS',
  opportunityId: opportunity.id,
  companyId: opportunity.company?.id ?? null,
  ownerId: opportunity.ownerId,
  price: opportunity.amount,
});
