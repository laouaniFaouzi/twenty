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

export const OPPORTUNITY_OFFER_FIELD_UNIVERSAL_IDENTIFIER = '4682e90a-9d55-4813-849a-afac9356f5af';

const OFFER_OPTION_IDS: Record<Offer, string> = {
  WEB: 'd507c958-af0f-4f7f-a351-fa31b75861db',
  SHOP: '65811381-baab-4a81-b5d9-3b1a7ad14fed',
  APP: 'e70f5a1b-017d-4589-829a-9c4469304627',
  SMART: '73b6224c-ec2f-4c50-ac45-caa4784a1b6b',
};

export default defineField({
  universalIdentifier: OPPORTUNITY_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'offer',
  label: 'Offre',
  description: "Offre Interfaze retenue pour l'opportunité",
  icon: 'IconPackage',
  isNullable: true,
  options: [
    ...OFFERS.map((offer, index) => ({
      id: OFFER_OPTION_IDS[offer],
      value: offer,
      label: OFFER_LABELS[offer],
      position: index,
      color: OFFER_COLORS[offer],
    })),
  ],
});
