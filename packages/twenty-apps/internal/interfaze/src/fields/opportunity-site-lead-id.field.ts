import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SITE_LEAD_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '10ff0973-2a8d-45e7-ad6a-4c2e3e4dfa44';

export default defineField({
  universalIdentifier: OPPORTUNITY_SITE_LEAD_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'siteLeadId',
  label: 'ID demande site',
  description:
    "Identifiant de la demande sur interfaze.fr qui a créé l'opportunité",
  icon: 'IconPlug',
  isNullable: true,
  isUIEditable: false,
});
