import { defineObject, FieldType } from 'twenty-sdk/define';

export const PROJECT_PHASE_UNIVERSAL_IDENTIFIER = '2661c768-ab11-4f91-9130-a577bc77d67e';

export const PROJECT_PHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER = 'c18e18ae-e95c-4bf5-b6f2-7132bd671d97';
export const PROJECT_PHASE_POSITION_FIELD_UNIVERSAL_IDENTIFIER = '93badff5-09d3-4d2d-bef1-1c4dfcabaf0d';

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
      universalIdentifier: PROJECT_PHASE_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'position',
      label: 'Position',
      icon: 'IconSortAscendingNumbers',
      isNullable: true,
    },
  ],
});
