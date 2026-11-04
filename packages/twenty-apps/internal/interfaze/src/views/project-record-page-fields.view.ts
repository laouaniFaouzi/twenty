import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-project.field';
import { OPPORTUNITY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-project.field';
import { OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/owner-on-project.field';
import {
  PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_LAUNCHED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project.object';

export const PROJECT_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER = 'cedf8c5f-2018-4bf3-b231-92fb0b6d1eed';

export default defineView({
  universalIdentifier: PROJECT_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Champs de la fiche projet',
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    { universalIdentifier: '6e898d67-a073-4574-a41e-2fc80ec5b728', fieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true },
    { universalIdentifier: 'e936dbe2-f28d-4be4-a4ec-71e9f138c50d', fieldMetadataUniversalIdentifier: COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true },
    { universalIdentifier: 'a71c940d-5b66-4259-8fa0-2f67f4e5116f', fieldMetadataUniversalIdentifier: OPPORTUNITY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true },
    { universalIdentifier: 'caa5ddbf-8041-4558-ad97-799e98ff6f22', fieldMetadataUniversalIdentifier: PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true },
    { universalIdentifier: 'ba37f215-8f26-4592-ac3a-2c06fd00464a', fieldMetadataUniversalIdentifier: OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true },
    { universalIdentifier: '8bef0ebf-3550-48ae-a813-ece15efc7779', fieldMetadataUniversalIdentifier: PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true },
    { universalIdentifier: '6c70191b-ca08-4e7b-ad69-556a7cfc3ce1', fieldMetadataUniversalIdentifier: PROJECT_PRICE_FIELD_UNIVERSAL_IDENTIFIER, position: 6, isVisible: true },
    { universalIdentifier: 'aadef531-336d-4bd0-9b2e-d2fafd91466c', fieldMetadataUniversalIdentifier: PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 7, isVisible: true },
    { universalIdentifier: 'ff165818-2055-4e8e-a4dd-23e0939acc8d', fieldMetadataUniversalIdentifier: PROJECT_LAUNCHED_AT_FIELD_UNIVERSAL_IDENTIFIER, position: 8, isVisible: true },
    { universalIdentifier: '8c11de8d-72de-4839-900d-49399267c7e6', fieldMetadataUniversalIdentifier: PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, position: 9, isVisible: true },
    { universalIdentifier: 'c2e33640-c726-45c7-8722-1775b4015b32', fieldMetadataUniversalIdentifier: PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER, position: 10, isVisible: true },
    { universalIdentifier: 'd435a562-84a3-4922-b8f8-1f3dc1441f58', fieldMetadataUniversalIdentifier: PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER, position: 11, isVisible: true },
  ],
});
