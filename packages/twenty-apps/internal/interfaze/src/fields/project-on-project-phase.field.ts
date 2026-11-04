import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export const PROJECT_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER = '09206d3e-c19d-484c-94b6-4b08e460224f';
export const PHASES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER = '5212a402-6058-4ba7-99ea-85e8ccfecd57';

export default defineField({
  universalIdentifier: PROJECT_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Projet',
  icon: 'IconBriefcase',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PHASES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'projectId',
  },
});
