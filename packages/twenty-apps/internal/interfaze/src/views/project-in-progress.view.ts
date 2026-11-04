import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-project.field';
import { OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/owner-on-project.field';
import {
  PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project.object';

export default defineView({
  universalIdentifier: '89ae6467-148f-4ff3-afe9-1ebbcfa76ccf',
  name: 'Projets en cours',
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconBriefcase',
  position: 0,
  fields: [
    { universalIdentifier: 'dda4ae2e-0527-4dc6-813f-3d26e52efa83', fieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 240 },
    { universalIdentifier: '2d516683-e00b-4c9d-8bcd-0f9e57952de5', fieldMetadataUniversalIdentifier: COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 180 },
    { universalIdentifier: 'ec5cb858-edd1-4aae-86fa-4cad2d12ec29', fieldMetadataUniversalIdentifier: PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 130 },
    { universalIdentifier: 'bd322ad1-e346-4ca5-a23f-831248a26aff', fieldMetadataUniversalIdentifier: OWNER_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 160 },
    { universalIdentifier: '6f752351-968e-4f44-ba28-c07af805cd8f', fieldMetadataUniversalIdentifier: PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
    { universalIdentifier: '1959cbdb-6045-4f03-922f-81e9a4f5aa63', fieldMetadataUniversalIdentifier: PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 200 },
    { universalIdentifier: '2697a542-a387-4b05-a942-0c83a44376ab', fieldMetadataUniversalIdentifier: PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 6, isVisible: true, size: 170 },
    { universalIdentifier: 'ac6c7c4b-ae08-4068-991a-5ade70725807', fieldMetadataUniversalIdentifier: PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER, position: 7, isVisible: true, size: 200 },
  ],
  filters: [
    {
      universalIdentifier: 'f3afb5e9-7193-4da3-973f-6389693ef8c2',
      fieldMetadataUniversalIdentifier: PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['IN_PROGRESS'],
    },
  ],
});
