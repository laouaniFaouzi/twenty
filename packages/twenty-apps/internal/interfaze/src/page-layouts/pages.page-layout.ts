import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Pages',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: 'fa8500d2-7735-4aea-8d57-aff44720bcc7',
      title: 'Pages',
      position: 0,
      icon: 'IconNotes',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier: '332d6e3a-249d-46e9-b2f2-62904b8c9a4b',
          title: 'Arborescence',
          type: 'FRONT_COMPONENT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
