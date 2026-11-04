import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  type Offer,
  OFFER_COLORS,
  OFFER_LABELS,
  OFFERS,
} from 'src/constants/offer';

export const OPPORTUNITY_NEED_FIELD_UNIVERSAL_IDENTIFIER = '3238e9c3-8a26-4117-aa7c-6b1fa9f75427';

export type Need = 'PROBLEM' | Offer;

const NEED_OPTION_IDS: Record<Offer, string> = {
  WEB: 'af046458-626c-4d0a-b60b-ed67fb421225',
  SHOP: '64dff5d1-fd3c-4f4f-98a0-f304a32c7f79',
  APP: '000234c1-a3f3-45ba-8c58-015d8e7c6440',
  SMART: '3f8e716c-587c-4d79-aaf5-7b23d789b5d8',
};

export default defineField({
  universalIdentifier: OPPORTUNITY_NEED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'need',
  label: 'Besoin',
  description: 'Besoin exprimé dans la demande',
  icon: 'IconBulb',
  isNullable: true,
  options: [
  { id: '3d6b5c38-c4c5-4acd-aa68-e3e125cb7938', value: 'PROBLEM' as const, label: 'Problème à régler', position: 0, color: 'gray' as const },
    ...OFFERS.map((offer, index) => ({
      id: NEED_OPTION_IDS[offer],
      value: offer,
      label: OFFER_LABELS[offer],
      position: index + 1,
      color: OFFER_COLORS[offer],
    })),
  ],
});
