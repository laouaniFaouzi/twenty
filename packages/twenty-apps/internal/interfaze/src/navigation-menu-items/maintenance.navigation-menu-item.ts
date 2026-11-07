import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';

export default defineNavigationMenuItem({
  universalIdentifier: '856f05b7-5985-4425-812b-310308a236b2',
  position: 4,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
});
