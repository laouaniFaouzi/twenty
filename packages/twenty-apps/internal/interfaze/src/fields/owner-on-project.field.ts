import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export const OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER = '9837c050-339e-41c2-9763-4954a9a89340';
export const OWNED_PROJECTS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER = 'c08017db-fd45-4cdb-a746-56226f68d06b';

export default defineField({
  universalIdentifier: OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Référent',
  description: 'La personne qui suit le projet du début à la fin',
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: OWNED_PROJECTS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
