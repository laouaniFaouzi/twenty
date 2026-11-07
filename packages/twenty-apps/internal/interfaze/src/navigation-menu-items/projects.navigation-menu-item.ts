import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export default defineNavigationMenuItem({
  universalIdentifier: '19bca588-73cb-4184-b98b-b97da2441f3a',
  position: 2,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
});
