import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-page.field';
import { OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-page.field';
import { PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/parent-page-on-page.field';
import { PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-page.field';
import {
  PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_IS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/page.object';

export const PAGE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER = '7be06016-c5f7-44fc-80e5-c764308a8896';

export default defineView({
  universalIdentifier: PAGE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Infos de la page',
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    { universalIdentifier: '82e2488e-4c3b-4224-9d79-91e0e4092b98', fieldMetadataUniversalIdentifier: PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true },
    { universalIdentifier: 'c4de538c-8155-4ea7-a597-d5e7fc50c55b', fieldMetadataUniversalIdentifier: PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true },
    { universalIdentifier: '5d705f32-0754-404d-a329-35b84893d84f', fieldMetadataUniversalIdentifier: PAGE_IS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true },
    { universalIdentifier: '58732f5b-c674-411f-a0c7-fff885c1e755', fieldMetadataUniversalIdentifier: PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true },
    { universalIdentifier: '7ea1f3b2-8bca-4698-875b-4be0503c7593', fieldMetadataUniversalIdentifier: COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true },
    { universalIdentifier: '3d8935ac-6841-44d2-aa0b-c4a71cdab22c', fieldMetadataUniversalIdentifier: OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true },
  ],
});
