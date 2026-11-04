import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';

export const COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER = 'cbadb731-35b1-46b2-8bba-d7889b410e3a';
export const MAINTENANCE_CONTRACTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER = 'b9d8225d-c342-44c9-a72d-98ac80e4a8eb';

export default defineField({
  universalIdentifier: COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Société',
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
