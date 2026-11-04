import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER = 'f1ba305a-5157-487d-8fd6-ab258a0fe52a';

export type RequestSource = 'HOME' | 'CONTACT' | 'OFFER_WEB' | 'OFFER_SHOP' | 'OFFER_APP' | 'OFFER_SMART';

export const REQUEST_SOURCE_OPTIONS: {
  id: string;
  value: RequestSource;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: 'f0e3bfad-9c72-41a3-bd5e-480e40c09c68', value: 'HOME', label: "Accueil", position: 0, color: 'gray' as const },
  { id: 'f4724eec-81cb-435d-a677-229db7124783', value: 'CONTACT', label: "Contact", position: 1, color: 'blue' as const },
  { id: 'ed2869de-3b1b-4736-8601-746c648e2819', value: 'OFFER_WEB', label: "Page WebFaze", position: 2, color: 'sky' as const },
  { id: 'ccac113f-2170-4857-89e7-3a74e60033dc', value: 'OFFER_SHOP', label: "Page ShopFaze", position: 3, color: 'green' as const },
  { id: '610a2d70-a0aa-4177-9b5d-96e238a8e6a7', value: 'OFFER_APP', label: "Page AppFaze", position: 4, color: 'purple' as const },
  { id: 'b71d2b4a-b736-49c0-b2c8-5133ff1c07cc', value: 'OFFER_SMART', label: "Page SmartFaze", position: 5, color: 'orange' as const },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'requestSource',
  label: "Source",
  description: "Formulaire d'interfaze.fr d'où vient la demande",
  icon: 'IconWorld',
  isNullable: true,
  options: REQUEST_SOURCE_OPTIONS,
});
