import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SITE_LEAD_STATUS_SEEN_FIELD_UNIVERSAL_IDENTIFIER =
  '2eea159f-db86-4011-9ea5-a95f1311102f';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_SITE_LEAD_STATUS_SEEN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'siteLeadStatusSeen',
  label: 'Statut site connu',
  description:
    'Dernier statut de la demande connu des deux côtés, pour ne jamais renvoyer un changement à son auteur',
  icon: 'IconPlug',
  isNullable: true,
  isUIEditable: false,
});
