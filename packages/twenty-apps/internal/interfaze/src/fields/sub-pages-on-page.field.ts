import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import {
  PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  SUB_PAGES_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/parent-page-on-page.field';

export default defineField({
  universalIdentifier: SUB_PAGES_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'subPages',
  label: 'Sous-pages',
  icon: 'IconFiles',
  relationTargetObjectMetadataUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
