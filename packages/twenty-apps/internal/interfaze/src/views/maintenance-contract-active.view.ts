import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-maintenance-contract.field';
import {
  MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-contract.object';

export default defineView({
  universalIdentifier: 'e44d7cc3-f16a-4c9f-a0e2-3a31469f5bd2',
  name: 'Contrats actifs',
  objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCircleCheck',
  position: 0,
  fields: [
    { universalIdentifier: '73165e7a-31be-4b68-a186-6d7c8fb904e7', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 220 },
    { universalIdentifier: 'dcc2fa97-617a-4fee-abf9-18e132e940e1', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: 'ea1d7ea9-65be-4ba4-afb7-284bd4148659', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 150 },
    { universalIdentifier: '87b33e7e-b04f-4d91-be54-b6201840159e', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 150 },
    { universalIdentifier: '13255c20-52f2-4b0c-8ef8-fc3527e0dac3', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
    { universalIdentifier: '9230d949-28af-42e3-86d8-e3cdc91b44fc', fieldMetadataUniversalIdentifier: COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 180 },
  ],
  filters: [
    {
      universalIdentifier: '4db2a936-979d-4673-9f22-44b09646e680',
      fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['ACTIVE'],
    },
  ],
});
