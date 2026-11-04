import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-project.field';
import { OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/owner-on-project.field';
import {
  PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_STATUS_OPTIONS,
  PROJECT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project.object';

const GROUP_IDS = ['24b3f3ed-71e2-4cb0-aa34-9d6c4fe85958', '06ff5d80-135d-436a-a3b2-ca65c81ac012', '12c67e26-5be4-4282-900d-61ebd093fd85'];

export default defineView({
  universalIdentifier: '6de9dd24-eda2-42e5-87f7-ef0b56a642d8',
  name: 'Projets par statut',
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier: PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: '517624f6-971e-4f89-a94b-ed8334dde7c4', fieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 220 },
    { universalIdentifier: 'a4944ffa-ec3f-464e-a394-528126d35d07', fieldMetadataUniversalIdentifier: COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 180 },
    { universalIdentifier: '31d0b50e-40f0-4172-89d5-7c9f432bc9dd', fieldMetadataUniversalIdentifier: PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 130 },
    { universalIdentifier: '00f29bfe-ea2c-430c-8e5e-bbb0d2ca1706', fieldMetadataUniversalIdentifier: OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 160 },
    { universalIdentifier: '914813e1-17b7-4f6a-81eb-523ef10323d6', fieldMetadataUniversalIdentifier: PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
  ],
  groups: PROJECT_STATUS_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
