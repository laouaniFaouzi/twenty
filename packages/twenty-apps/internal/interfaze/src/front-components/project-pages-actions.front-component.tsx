import { defineFrontComponent } from 'twenty-sdk/define';

import { PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { RecordPagesActions } from 'src/front-components/record-pages-actions';

const ProjectPagesActions = () => <RecordPagesActions objectName="project" />;

export default defineFrontComponent({
  universalIdentifier: PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'project-pages-actions',
  description: "Nouvelle page ou page depuis un modèle, rattachée à la fiche d'un projet",
  component: ProjectPagesActions,
});
