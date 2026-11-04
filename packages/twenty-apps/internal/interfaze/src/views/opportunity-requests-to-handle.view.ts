import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-interfaze-stage.field';
import { OPPORTUNITY_NEED_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-need.field';
import { OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-received-at.field';
import { OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-request-source.field';
import { OPPORTUNITY_TIMING_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-timing.field';

const opportunity = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity;

export default defineView({
  universalIdentifier: '878fe89b-dfa1-4860-8746-7b66c1b6b1e3',
  name: 'Demandes à traiter',
  objectUniversalIdentifier: opportunity.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconInbox',
  position: 1,
  fields: [
    { universalIdentifier: '58c16637-98bd-41c1-8bbe-c7dd32d3e3ef', fieldMetadataUniversalIdentifier: opportunity.fields.name.universalIdentifier, position: 0, isVisible: true, size: 220 },
    { universalIdentifier: '437f89c2-3644-4da7-b42e-bfa0c1f44a28', fieldMetadataUniversalIdentifier: OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 160 },
    { universalIdentifier: '6c69f1ef-9ef0-475c-8c6e-e36e9d79311f', fieldMetadataUniversalIdentifier: OPPORTUNITY_NEED_FIELD_UNIVERSAL_IDENTIFIER, position: 2, isVisible: true, size: 160 },
    { universalIdentifier: '6e09f8ed-e459-4463-89b2-72d61df55c2a', fieldMetadataUniversalIdentifier: OPPORTUNITY_TIMING_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 140 },
    { universalIdentifier: '256525e9-a834-4920-9467-cbb0c4440693', fieldMetadataUniversalIdentifier: OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER, position: 4, isVisible: true, size: 140 },
    { universalIdentifier: '89db8f2d-6020-4594-b8b6-37995a599c8e', fieldMetadataUniversalIdentifier: opportunity.fields.pointOfContact.universalIdentifier, position: 5, isVisible: true, size: 180 },
    { universalIdentifier: '97e0ce8a-3c30-43aa-9a4c-2a712e73c9bc', fieldMetadataUniversalIdentifier: opportunity.fields.owner.universalIdentifier, position: 6, isVisible: true, size: 160 },
  ],
  filters: [
    {
      universalIdentifier: 'b43b7311-67c1-4bed-9d89-e104e3333f0c',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['NEW_REQUEST'],
    },
  ],
  sorts: [
    {
      universalIdentifier: 'c891ab06-6ca3-48b6-a01d-29c2e7099c82',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
});
