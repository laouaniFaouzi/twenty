import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';
import {
  ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  ASSIGNED_TRACKER_TASKS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/assignee-on-project-task.field';

export default defineField({
  universalIdentifier: ASSIGNED_TRACKER_TASKS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'assignedTrackerTasks',
  label: 'Tâches de suivi assignées',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
