import {
  defineView,
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
  ViewType,
} from 'twenty-sdk/define';

import { COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-maintenance-contract.field';
import {
  MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-contract.object';
import { relativeDate } from 'src/page-layouts/utils/chart-filters';

const RENEWAL_WINDOW_FILTER_GROUP_UNIVERSAL_IDENTIFIER =
  '62d9c4dc-e706-4327-8991-0b4854919159';

export default defineView({
  universalIdentifier: '78dd072a-fe68-43d3-a2df-204b8ad21b84',
  name: 'À renouveler sous 30 jours',
  objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCalendarRepeat',
  position: 1,
  fields: [
    { universalIdentifier: 'a393bbc8-06a6-4081-9d8d-e5439f689c03', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 220 },
    { universalIdentifier: '468553b3-4f4c-44a3-9c46-8afc086111b5', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 200 },
    { universalIdentifier: '4f3d2fef-f0a0-4af1-8a5c-2f1e8f681dfe', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 150 },
    { universalIdentifier: '9fe3c630-ab10-4e5d-92d5-1fa68c94951f', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 150 },
    { universalIdentifier: '80db77bd-3c6c-4bda-94fa-837861fd20df', fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 120 },
    { universalIdentifier: '0efc84a5-d5fa-4c09-9850-fa08b923f115', fieldMetadataUniversalIdentifier: COMPANY_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 180 },
  ],
  filters: [
    {
      universalIdentifier: 'f818211a-411b-41d4-b3a4-76676e85b524',
      fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['ACTIVE'],
    },
    // Late renewals and today's stay listed until the renewal date moves on.
    {
      universalIdentifier: '09989bf5-0203-422b-82a3-a9db6d2a471e',
      fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_IN_PAST,
      value: '',
      viewFilterGroupUniversalIdentifier: RENEWAL_WINDOW_FILTER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: '68fb0dea-a2c4-4811-b4a6-649524eeb5fb',
      fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_RELATIVE,
      value: relativeDate('THIS', 1, 'DAY'),
      viewFilterGroupUniversalIdentifier: RENEWAL_WINDOW_FILTER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 1,
    },
    {
      universalIdentifier: '5c9c931e-e6df-438f-8372-a367b61f90b7',
      fieldMetadataUniversalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_RELATIVE,
      value: relativeDate('NEXT', 30, 'DAY'),
      viewFilterGroupUniversalIdentifier: RENEWAL_WINDOW_FILTER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 2,
    },
  ],
  filterGroups: [
    {
      universalIdentifier: RENEWAL_WINDOW_FILTER_GROUP_UNIVERSAL_IDENTIFIER,
      logicalOperator: ViewFilterGroupLogicalOperator.OR,
    },
  ],
});
