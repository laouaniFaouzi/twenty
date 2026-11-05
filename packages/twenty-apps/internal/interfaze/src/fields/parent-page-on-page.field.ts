import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';

export const PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER = 'd5db5b70-f531-4de7-b12d-79e4a9f5bf29';
export const SUB_PAGES_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER = '9f3f128d-e060-4a5f-9c88-a54f990315e9';

export default defineField({
  universalIdentifier: PARENT_PAGE_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'parentPage',
  label: 'Page parente',
  icon: 'IconFolderUp',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: SUB_PAGES_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'parentPageId',
  },
});
