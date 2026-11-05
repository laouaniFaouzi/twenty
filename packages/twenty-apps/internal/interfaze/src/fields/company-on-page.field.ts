import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';

export const COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER = 'f15b37dd-d333-4904-b627-6fd7c6c81a85';
export const PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER = 'f95fa57f-96e8-496a-b251-9cfaf7cf9789';

export default defineField({
  universalIdentifier: COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Société',
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
