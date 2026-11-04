import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_OSEZ_IA_FIELD_UNIVERSAL_IDENTIFIER = 'cdf0fcdd-9d5b-41d2-93ea-4678624c952b';

export type OsezIaStatus = 'NOT_CONCERNED' | 'TO_CHECK' | 'ELIGIBLE' | 'FILED' | 'GRANTED' | 'REFUSED';

export const OSEZ_IA_OPTIONS: {
  id: string;
  value: OsezIaStatus;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: '1d68ae51-5c55-463a-8d8e-67df6c2ad7ea', value: 'NOT_CONCERNED', label: "Non concerné", position: 0, color: 'gray' as const },
  { id: 'b2737283-dc86-4bf1-948e-3842e6916a50', value: 'TO_CHECK', label: "À vérifier", position: 1, color: 'yellow' as const },
  { id: '2f3c1cd5-0805-4212-a00d-bc892eb3f918', value: 'ELIGIBLE', label: "Éligible", position: 2, color: 'sky' as const },
  { id: 'bf0606db-4a33-4cb0-8ec4-46f7184a6855', value: 'FILED', label: "Dossier déposé", position: 3, color: 'blue' as const },
  { id: 'c5c22910-b7f6-4b85-b7bc-d191d540b2b6', value: 'GRANTED', label: "Accordé", position: 4, color: 'green' as const },
  { id: 'e01bfed0-01ff-4731-8db9-f62865be91b9', value: 'REFUSED', label: "Refusé", position: 5, color: 'red' as const },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_OSEZ_IA_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'osezIa',
  label: "Osez l'IA",
  description: "Cofinancement « Osez l'IA » pour SmartFaze",
  icon: 'IconCoins',
  isNullable: true,
  options: OSEZ_IA_OPTIONS,
});
