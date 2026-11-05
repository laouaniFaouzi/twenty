import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';

export const OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER = '3fb6e328-62db-4fa6-89e5-f464066e99b4';
export const PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER = '63cbeeba-96fd-41eb-b446-3b1a8eaee87a';

export default defineField({
  universalIdentifier: OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'opportunity',
  label: 'Opportunité',
  icon: 'IconTargetArrow',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'opportunityId',
  },
});
