import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-on-page.field';
import { OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/opportunity-pages-widget.view';

// Added to the standard record page without replacing its own tabs.
export default definePageLayoutTab({
  universalIdentifier: '009cc523-0d95-4f7d-a3f1-3a2f629da988',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.universalIdentifier,
  title: 'Pages',
  position: 1000,
  icon: 'IconNotes',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: 'dd725230-260f-42e7-9a4c-1fbaf94c912a',
      title: 'Nouvelle page',
      type: 'FRONT_COMPONENT',
      configuration: {
        configurationType: 'FRONT_COMPONENT',
        frontComponentUniversalIdentifier: OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      },
    },
    {
      universalIdentifier: '45bcb32c-3f1a-408e-bb7a-60483ea8877d',
      title: 'Pages',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
        viewId: OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
      },
    },
  ],
});
