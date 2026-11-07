import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/opportunity-pipeline.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'b5472133-da62-479b-8d61-6574111a3291',
  name: 'Pipeline',
  icon: 'IconTargetArrow',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
});
