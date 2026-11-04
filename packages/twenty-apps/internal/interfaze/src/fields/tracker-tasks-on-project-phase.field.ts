import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';
import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';
import {
  PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  TRACKER_TASKS_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/phase-on-project-task.field';

export default defineField({
  universalIdentifier: TRACKER_TASKS_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'trackerTasks',
  label: 'Tâches de suivi',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
