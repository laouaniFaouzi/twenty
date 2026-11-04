import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

export const PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER = '5cdda3fc-6823-4484-ad6f-75018bc77ed8';
export const MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER = '1dcc47da-c998-499a-ac77-f2a35bf77de9';

export default defineField({
  universalIdentifier: PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Projet',
  icon: 'IconBriefcase',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'projectId',
  },
});
