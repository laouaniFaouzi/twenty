import { defineObject, FieldType } from 'twenty-sdk/define';

export const PROJECT_PHASE_UNIVERSAL_IDENTIFIER =
  '2661c768-ab11-4f91-9130-a577bc77d67e';

export const PROJECT_PHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'c18e18ae-e95c-4bf5-b6f2-7132bd671d97';

export const PROJECT_PHASE_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '4b72270a-4b85-4960-8d8e-83440f8369ad';
export const PROJECT_PHASE_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '2f27bb18-5cc9-4c10-a082-96301559aaeb';
export const PROJECT_PHASE_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER =
  '1f7c3eae-0a36-41fc-b6f0-f3e6e5fed763';

export default defineObject({
  universalIdentifier: PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'projectPhase',
  namePlural: 'projectPhases',
  labelSingular: 'Phase',
  labelPlural: 'Phases',
  description: "Une étape du suivi d'un projet",
  icon: 'IconStairs',
  labelIdentifierFieldMetadataUniversalIdentifier:
    PROJECT_PHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PROJECT_PHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nom',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PROJECT_PHASE_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'siteId',
      label: 'ID phase site',
      description: 'Identifiant de la phase sur interfaze.fr',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier:
        PROJECT_PHASE_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'siteUpdatedAt',
      label: 'Modifié sur le site le',
      description: 'Date de la dernière version du site appliquée ou envoyée',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_PHASE_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'syncHash',
      label: 'Empreinte de synchro',
      description:
        'Empreinte du dernier état sur lequel HubFaze et le site sont d’accord',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
