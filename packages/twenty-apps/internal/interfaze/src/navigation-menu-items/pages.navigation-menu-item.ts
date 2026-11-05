import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: '1f5a47c0-9944-4f8f-9d32-a7aea13e3da8',
  name: 'Pages',
  icon: 'IconNotes',
  position: 4,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
