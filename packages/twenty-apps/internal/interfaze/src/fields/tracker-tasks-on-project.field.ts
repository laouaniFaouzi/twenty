import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import {
  PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-project-task.field';

export default defineField({
  universalIdentifier: TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'trackerTasks',
  label: 'Tâches de suivi',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
