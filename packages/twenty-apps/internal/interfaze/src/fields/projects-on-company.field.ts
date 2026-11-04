import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import {
  COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/company-on-project.field';

export default defineField({
  universalIdentifier: PROJECTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'projects',
  label: 'Projets',
  icon: 'IconBriefcase',
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: COMPANY_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
