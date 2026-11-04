import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';

export const ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER = '2b9d1641-8759-405a-adec-efeea9ebd15e';
export const ASSIGNED_TRACKER_TASKS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER = '07f17c2b-9d1e-4b24-a679-079c27d0e08b';

export default defineField({
  universalIdentifier: ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'assignee',
  label: 'Responsable',
  description: "Interne à l'équipe, jamais envoyé au site",
  icon: 'IconUserCircle',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: ASSIGNED_TRACKER_TASKS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'assigneeId',
  },
});
