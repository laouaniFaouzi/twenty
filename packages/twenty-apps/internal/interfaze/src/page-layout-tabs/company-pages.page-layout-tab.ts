import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-page.field';
import { COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/company-pages-widget.view';

// Added to the standard record page without replacing its own tabs.
export default definePageLayoutTab({
  universalIdentifier: 'bd559404-e865-4b10-a2dd-22419c857914',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.universalIdentifier,
  title: 'Pages',
  position: 1000,
  icon: 'IconNotes',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: 'f50450dd-cc5e-499a-ba2a-04f13fb80d8b',
      title: 'Nouvelle page',
      type: 'FRONT_COMPONENT',
      configuration: {
        configurationType: 'FRONT_COMPONENT',
        frontComponentUniversalIdentifier: COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      },
    },
    {
      universalIdentifier: '64fcbab9-1553-40f4-808a-13f9eaf8a931',
      title: 'Pages',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
        viewId: COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
      },
    },
  ],
});
