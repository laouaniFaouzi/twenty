import { defineView, ViewType } from 'twenty-sdk/define';

import { PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-maintenance-contract.field';
import {
  MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-contract.object';

import { currentRecordFilter } from 'src/views/utils/current-record-filter';

export const PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = 'f71abe1d-8f50-4f8d-9aaf-939ddff9a981';

// TABLE_WIDGET keeps this view out of the record index view pickers.
export default defineView({
  universalIdentifier: PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Contrats du projet',
  icon: 'IconTool',
  objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE_WIDGET,
  fields: [
    { universalIdentifier: 'c6b10162-f8f6-473d-ac44-1768bbad06b4', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 220 },
    { universalIdentifier: 'a1df865a-75ba-47e3-8a87-770363f37201', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: '8bdfb463-f9a7-4b27-92f2-27fa5a49ec8d', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 150 },
    { universalIdentifier: '57b8d3ef-e96c-4a80-9703-08bf69214e51', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 150 },
    { universalIdentifier: '717cc200-d883-48db-93a0-dfc8ac7965ff', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
  ],
  filters: [currentRecordFilter('51111391-553c-4f3f-b5d6-3df596038087', PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER)],
});
