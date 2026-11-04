export type Offer = 'WEB' | 'SHOP' | 'APP' | 'SMART';

export const OFFERS: readonly Offer[] = ['WEB', 'SHOP', 'APP', 'SMART'];

export const OFFER_LABELS: Record<Offer, string> = {
  WEB: 'WebFaze',
  SHOP: 'ShopFaze',
  APP: 'AppFaze',
  SMART: 'SmartFaze',
};
