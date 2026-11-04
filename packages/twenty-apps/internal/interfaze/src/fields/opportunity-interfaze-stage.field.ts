import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER = '042696ba-fb55-42f1-9e8f-4162dc03a7c9';

export type InterfazeStage = 'NEW_REQUEST' | 'DISCUSSION' | 'QUOTE_SENT' | 'WON' | 'LOST';

export const INTERFAZE_STAGE_OPTIONS: {
  id: string;
  value: InterfazeStage;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: 'b5fa8f6f-6f40-486e-a4a8-8782c3267d06', value: 'NEW_REQUEST', label: 'Nouvelle demande', position: 0, color: 'sky' as const },
  { id: 'a57474dd-0579-4509-bbbe-9e5cdef65933', value: 'DISCUSSION', label: 'Échange', position: 1, color: 'blue' as const },
  { id: 'c3e82e6e-8e6f-4354-9fc4-b501016c746b', value: 'QUOTE_SENT', label: 'Devis envoyé', position: 2, color: 'purple' as const },
  { id: '93085977-cd48-4c9a-83c4-e54ccdfabf1d', value: 'WON', label: 'Signé', position: 3, color: 'green' as const },
  { id: '75e1ecce-7f5c-4df4-aa9e-0cf4929e1b79', value: 'LOST', label: 'Perdu', position: 4, color: 'red' as const },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'interfazeStage',
  label: 'Étape',
  description: "Étape de l'opportunité dans le pipeline Interfaze",
  icon: 'IconProgressCheck',
  defaultValue: "'NEW_REQUEST'",
  options: INTERFAZE_STAGE_OPTIONS,
});
