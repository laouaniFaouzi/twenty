import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/assignee-on-project-task.field';
import { PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-project-task.field';
import {
  PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-task.object';

export default defineView({
  universalIdentifier: '09e0fc1a-cd83-4d7f-ba86-f96d6300b0ea',
  name: 'En retard',
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconAlarm',
  position: 1,
  fields: [
    { universalIdentifier: 'bee8aecb-a8e2-4bbc-96e2-b58b2cfe57d0', fieldMetadataUniversalIdentifier: PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: 'e342b07e-f87e-45a4-8f7f-f2e9ca151177', fieldMetadataUniversalIdentifier: PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: '453151ed-2902-41cb-a180-983e0f20553c', fieldMetadataUniversalIdentifier: PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 140 },
    { universalIdentifier: 'b1fd987e-c844-4c32-97c8-0f0153ae3a29', fieldMetadataUniversalIdentifier: ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 160 },
    { universalIdentifier: '0a11f604-7d7b-4406-a852-0695d8d97b4c', fieldMetadataUniversalIdentifier: PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 130 },
  ],
  filters: [
    {
      universalIdentifier: '56c46274-6049-4d7b-8645-74fb0285d555',
      fieldMetadataUniversalIdentifier: PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_IN_PAST,
      value: '',
    },
    {
      universalIdentifier: '63c62675-6f74-4a3f-959a-74286f0b4736',
      fieldMetadataUniversalIdentifier: PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_NOT,
      value: ['DONE'],
    },
  ],
});
