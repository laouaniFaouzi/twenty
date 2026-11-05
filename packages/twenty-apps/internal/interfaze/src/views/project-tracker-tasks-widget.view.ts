import { defineView, ViewType } from 'twenty-sdk/define';

import { ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/assignee-on-project-task.field';
import { PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/phase-on-project-task.field';
import { PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-project-task.field';
import {
  PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-task.object';

import { currentRecordFilter } from 'src/views/utils/current-record-filter';

export const PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = '8a7ff400-5fbc-4086-9b09-4461a0e54259';

// TABLE_WIDGET keeps this view out of the record index view pickers. Rows
// follow the system position field, numbered across phases by the seeding.
export default defineView({
  universalIdentifier: PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Suivi du projet',
  icon: 'IconChecklist',
  objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE_WIDGET,
  fields: [
    { universalIdentifier: '064f12c2-9726-43a7-88d2-e1fb8f380d65', fieldMetadataUniversalIdentifier: PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 260 },
    { universalIdentifier: '6301af1c-49c8-48e3-97e2-a5a3642d9d82', fieldMetadataUniversalIdentifier: PHASE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: '0463fd9f-45c4-4659-8212-eab023af4c9b', fieldMetadataUniversalIdentifier: PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 130 },
    { universalIdentifier: 'e8b82b6a-e3e0-4074-bf57-45128ea98e7a', fieldMetadataUniversalIdentifier: ASSIGNEE_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 160 },
    { universalIdentifier: 'af73ac29-bdbe-4f40-80e7-b33e7f632f46', fieldMetadataUniversalIdentifier: PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 140 },
  ],
  filters: [currentRecordFilter('391bbd5c-320e-495e-b665-0c86e843e5b3', PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER)],
});
