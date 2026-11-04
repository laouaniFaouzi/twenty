import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_LOST_REASON_FIELD_UNIVERSAL_IDENTIFIER = '0148413e-787c-4f0e-bb56-45cd17cf8313';

export type LostReason = 'PRICE' | 'TIMING' | 'NO_ANSWER' | 'COMPETITOR' | 'ABANDONED' | 'OTHER';

export const LOST_REASON_OPTIONS: {
  id: string;
  value: LostReason;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: '099dff55-a102-4930-9506-23c502f6f197', value: 'PRICE', label: "Prix", position: 0, color: 'red' as const },
  { id: '10513128-1267-4e2f-be9f-8b637cc14637', value: 'TIMING', label: "Délai", position: 1, color: 'orange' as const },
  { id: 'a46c358c-1f9f-4bd3-9a32-b309d13dec4d', value: 'NO_ANSWER', label: "Sans réponse", position: 2, color: 'gray' as const },
  { id: '8ad1dd93-5061-41c2-9fe5-e4b8d0c5a9e7', value: 'COMPETITOR', label: "Concurrent", position: 3, color: 'purple' as const },
  { id: 'd1336347-4707-4a8b-b1cd-7f5fb85bafab', value: 'ABANDONED', label: "Projet abandonné", position: 4, color: 'yellow' as const },
  { id: '848252ee-1948-40d5-a331-e9b2fac031f0', value: 'OTHER', label: "Autre", position: 5, color: 'gray' as const },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_LOST_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'lostReason',
  label: "Motif de perte",
  description: "Pourquoi l'opportunité est perdue",
  icon: 'IconThumbDown',
  isNullable: true,
  options: LOST_REASON_OPTIONS,
});
