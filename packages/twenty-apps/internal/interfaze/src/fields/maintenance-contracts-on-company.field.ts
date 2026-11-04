import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';
import {
  COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/company-on-maintenance-contract.field';

export default defineField({
  universalIdentifier: MAINTENANCE_CONTRACTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'maintenanceContracts',
  label: 'Contrats de maintenance',
  icon: 'IconTool',
  relationTargetObjectMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
