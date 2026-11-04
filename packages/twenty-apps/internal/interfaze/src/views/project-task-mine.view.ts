import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/assignee-on-project-task.field';
import { PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-project-task.field';
import {
  PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_STATUS_OPTIONS,
  PROJECT_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-task.object';

const GROUP_IDS = ['64768889-5410-4f78-ac00-3aa5ed37994a', '725eb51a-9a8b-4014-9bce-77e312518708', 'a197e6e1-286d-4b17-9523-cd148c29ed4c'];

export default defineView({
  universalIdentifier: '9491a1c7-6684-4a7b-a86c-054ce2546869',
  name: 'Mes tâches',
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconUserCheck',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: '872077d8-afb4-431e-b86d-919ba1c8d774', fieldMetadataUniversalIdentifier: PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: '734f79fe-6542-42af-b6fa-48edc01d437a', fieldMetadataUniversalIdentifier: PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: '2529e82e-1d0c-436b-b55a-14c6d1cfa166', fieldMetadataUniversalIdentifier: PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 140 },
  ],
  groups: PROJECT_TASK_STATUS_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: '0156299d-3265-498b-b7f7-0bafb0b814ae',
      fieldMetadataUniversalIdentifier: ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: JSON.stringify({
        isCurrentWorkspaceMemberSelected: true,
        selectedRecordIds: [],
      }),
    },
  ],
});
