import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_REQUEST_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER = 'b7e637df-cde2-4f5f-8450-f5f1e2bd966d';

export default defineField({
  universalIdentifier: OPPORTUNITY_REQUEST_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'requestMessage',
  label: "Message",
  description: "Message laissé dans le formulaire du site",
  icon: 'IconMessage',
  isNullable: true,
});
