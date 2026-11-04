import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';
import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';

export const PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER = 'fba9af58-4ea3-4010-b754-3bf6c1d7eef1';
export const TRACKER_TASKS_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER = 'cc6cf46f-bbff-4296-a90a-c855d62b038a';

export default defineField({
  universalIdentifier: PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'phase',
  label: 'Phase',
  icon: 'IconStairs',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TRACKER_TASKS_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'phaseId',
  },
});
