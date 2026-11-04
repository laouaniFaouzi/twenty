import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export const PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER = 'f5249d62-36a6-45e9-83f8-844913c74c0d';
export const TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER = '1ece9ee5-2e67-4476-9757-3fa20d852869';

export default defineField({
  universalIdentifier: PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Projet',
  icon: 'IconBriefcase',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'projectId',
  },
});
