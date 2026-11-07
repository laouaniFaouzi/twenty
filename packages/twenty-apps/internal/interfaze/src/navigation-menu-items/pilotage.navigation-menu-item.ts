import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: '423e9b3b-8046-4ad5-a0ac-f5c9b973a285',
  name: 'Pilotage',
  icon: 'IconLayoutDashboard',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
