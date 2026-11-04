import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import {
  PROJECT_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  PHASES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-project-phase.field';

export default defineField({
  universalIdentifier: PHASES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'phases',
  label: 'Phases',
  icon: 'IconStairs',
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_ON_PROJECT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
