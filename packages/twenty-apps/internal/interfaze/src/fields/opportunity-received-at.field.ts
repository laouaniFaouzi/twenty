import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER = '05d4d241-b6c7-4629-bb73-9aae584ef186';

export default defineField({
  universalIdentifier: OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'receivedAt',
  label: 'Reçue le',
  description: 'Date de réception de la demande',
  icon: 'IconCalendarEvent',
  isNullable: true,
});
