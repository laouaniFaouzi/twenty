import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER =
  'ef05e762-0506-4d2d-9f93-37cf53fb9181';

// Kept up to date every hour: dashboard filters cannot say "received more than 48 hours ago".
export default defineField({
  universalIdentifier: OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'responseOverdue',
  label: 'Sans réponse après 48 h',
  description:
    "Demande restée à l'étape Nouvelle demande plus de 48 h après sa réception, recalculé toutes les heures",
  icon: 'IconClockExclamation',
  defaultValue: false,
  isUIEditable: false,
});
