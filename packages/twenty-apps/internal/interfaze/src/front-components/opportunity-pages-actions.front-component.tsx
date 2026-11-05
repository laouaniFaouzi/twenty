import { defineFrontComponent } from 'twenty-sdk/define';

import { OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordPagesActions } from 'src/front-components/record-pages-actions';

const OpportunityPagesActions = () => (
  <RecordPagesActions objectName="opportunity" />
);

export default defineFrontComponent({
  universalIdentifier:
    OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'opportunity-pages-actions',
  description:
    "Nouvelle page ou page depuis un modèle, rattachée à la fiche d'une opportunité",
  component: OpportunityPagesActions,
});
