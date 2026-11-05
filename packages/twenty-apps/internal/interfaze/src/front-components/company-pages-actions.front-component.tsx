import { defineFrontComponent } from 'twenty-sdk/define';

import { COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordPagesActions } from 'src/front-components/record-pages-actions';

const CompanyPagesActions = () => <RecordPagesActions objectName="company" />;

export default defineFrontComponent({
  universalIdentifier:
    COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'company-pages-actions',
  description:
    "Nouvelle page ou page depuis un modèle, rattachée à la fiche d'une société",
  component: CompanyPagesActions,
});
