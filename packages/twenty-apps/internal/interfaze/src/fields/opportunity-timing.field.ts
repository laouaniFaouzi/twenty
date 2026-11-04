import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_TIMING_FIELD_UNIVERSAL_IDENTIFIER = '879a6517-ed97-4ac2-b739-72e5a460d56d';

export type Timing = 'ASAP' | 'ONE_TO_THREE_MONTHS' | 'NO_DATE';

export const TIMING_OPTIONS: {
  id: string;
  value: Timing;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: 'a858009d-3188-465a-8e91-76a54db17937', value: 'ASAP', label: "Dès que possible", position: 0, color: 'red' as const },
  { id: '26f4290c-612c-4dc0-b12d-a493e22c7497', value: 'ONE_TO_THREE_MONTHS', label: "1 à 3 mois", position: 1, color: 'orange' as const },
  { id: '9e677633-e871-472f-9721-86f8d2dffa5e', value: 'NO_DATE', label: "Pas de date", position: 2, color: 'gray' as const },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_TIMING_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'timing',
  label: "Délai",
  description: "Délai souhaité par le client",
  icon: 'IconCalendarTime',
  isNullable: true,
  options: TIMING_OPTIONS,
});
