import { defineView } from 'twenty-sdk/define';

import { OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-page.field';
import { pagesWidgetViewConfig } from 'src/views/utils/pages-widget-view-config';

export const OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = 'dd7ce57b-0da3-4c86-b29b-bfce0d7403fe';

export default defineView(
  pagesWidgetViewConfig({
    universalIdentifier: OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
    name: "Pages de l'opportunité",
    relationFieldUniversalIdentifier: OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
    titleFieldUniversalIdentifier: '974d8af6-6b46-44c6-b178-ff5807292d06',
    iconFieldUniversalIdentifier: '580539cd-f05f-413f-b7c1-8057ed0355a8',
    filterUniversalIdentifier: '631ca184-a43a-4fea-8764-7339690a703c',
  }),
);
