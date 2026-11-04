import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import {
  PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-maintenance-contract.field';

export default defineField({
  universalIdentifier: MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceContracts',
  label: 'Contrats de maintenance',
  icon: 'IconTool',
  relationTargetObjectMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
