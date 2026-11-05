import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import {
  PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-page.field';

export default defineField({
  universalIdentifier: PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'pages',
  label: 'Pages',
  icon: 'IconNotes',
  relationTargetObjectMetadataUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
