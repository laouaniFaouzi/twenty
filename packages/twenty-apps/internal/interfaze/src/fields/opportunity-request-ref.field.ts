import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_REQUEST_REF_FIELD_UNIVERSAL_IDENTIFIER = 'a1e30c3f-005f-4b71-9db6-f96e59ca0172';

export default defineField({
  universalIdentifier: OPPORTUNITY_REQUEST_REF_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'requestRef',
  label: 'Réf. demande',
  description: 'Référence de la demande sur le site (IFZ-…)',
  icon: 'IconHash',
  isNullable: true,
});
