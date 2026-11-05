import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export const PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER = '750b7648-04a4-467d-b314-58fbde4f7805';
export const PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER = '82d7aa11-981d-43d6-b34a-87414eddd771';

export default defineField({
  universalIdentifier: PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Projet',
  icon: 'IconBriefcase',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'projectId',
  },
});
