import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import {
  OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-on-page.field';

export default defineField({
  universalIdentifier: PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'pages',
  label: 'Pages',
  icon: 'IconNotes',
  relationTargetObjectMetadataUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
