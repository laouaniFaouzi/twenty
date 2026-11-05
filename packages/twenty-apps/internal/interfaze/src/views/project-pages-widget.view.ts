import { defineView } from 'twenty-sdk/define';

import { PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-page.field';
import { pagesWidgetViewConfig } from 'src/views/utils/pages-widget-view-config';

export const PROJECT_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = 'cb6bbf17-40bd-44a3-a95d-09ca4eee50ce';

export default defineView(
  pagesWidgetViewConfig({
    universalIdentifier: PROJECT_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
    name: "Pages du projet",
    relationFieldUniversalIdentifier: PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
    titleFieldUniversalIdentifier: '79b0c5d8-216e-42ac-a47f-034c813a5491',
    iconFieldUniversalIdentifier: 'd14884e5-d7ea-4cf9-a543-9e0d2400aa32',
    filterUniversalIdentifier: '0b56aec3-cdad-43da-b661-54cdc57d9ca3',
  }),
);
