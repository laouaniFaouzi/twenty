import { defineView } from 'twenty-sdk/define';

import { COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-page.field';
import { pagesWidgetViewConfig } from 'src/views/utils/pages-widget-view-config';

export const COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = 'ca6684d5-98b3-499d-86df-9de5e2374bba';

export default defineView(
  pagesWidgetViewConfig({
    universalIdentifier: COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
    name: "Pages de la société",
    relationFieldUniversalIdentifier: COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
    titleFieldUniversalIdentifier: '04370913-805e-47a7-99a9-60c6928ebb17',
    iconFieldUniversalIdentifier: '403de713-6360-4689-abcb-e32b4aaeea50',
    filterUniversalIdentifier: 'ec2a1dc8-e684-4e71-a677-6d3489b02c2d',
  }),
);
