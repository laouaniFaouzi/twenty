import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';

export default defineNavigationMenuItem({
  universalIdentifier: '11767acc-691e-4c78-a9d1-6b4788fd0f41',
  position: 3,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
});
