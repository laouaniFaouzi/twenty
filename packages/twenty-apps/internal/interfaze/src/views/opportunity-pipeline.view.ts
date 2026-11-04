import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
} from 'twenty-sdk/define';

import {
  INTERFAZE_STAGE_OPTIONS,
  OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-interfaze-stage.field';
import { OPPORTUNITY_OFFER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-offer.field';
import { OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-received-at.field';

export const OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER = '3200bac9-3395-417d-ac70-94f62e0221b4';

const opportunity = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity;

const GROUP_IDS = ['0bf95492-99aa-4ed5-ad1e-c5008773c81b', 'b6ccc9ce-f02e-49fb-b7ab-32039fcb2722', 'eb847ea5-cb8c-432c-ae09-5c91d795c21b', 'dfa94b4e-068e-4b5b-8af2-2096f8842aaa', 'fb52c63a-3bb4-46d5-995b-7f74aabae451'];

export default defineView({
  universalIdentifier: OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Pipeline',
  objectUniversalIdentifier: opportunity.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconTargetArrow',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: '53e39372-d362-4f0b-8930-19470207c3e1', fieldMetadataUniversalIdentifier: opportunity.fields.name.universalIdentifier, position: 0, isVisible: true, size: 200 },
    { universalIdentifier: 'b3c8aa51-f769-42b5-8934-d0923321ea1e', fieldMetadataUniversalIdentifier: opportunity.fields.company.universalIdentifier, position: 1, isVisible: true, size: 180 },
    { universalIdentifier: '05c44ab8-5168-41ee-9b4f-3820c2dc3ba8', fieldMetadataUniversalIdentifier: opportunity.fields.amount.universalIdentifier, position: 2, isVisible: true, size: 140 },
    { universalIdentifier: '5d256475-f6b4-4190-9fe0-3916f426d406', fieldMetadataUniversalIdentifier: OPPORTUNITY_OFFER_FIELD_UNIVERSAL_IDENTIFIER, position: 3, isVisible: true, size: 140 },
    { universalIdentifier: '91619bfa-fb0b-435e-8d82-5251c8e6d8d2', fieldMetadataUniversalIdentifier: opportunity.fields.owner.universalIdentifier, position: 4, isVisible: true, size: 160 },
    { universalIdentifier: '5224ac0c-7254-4675-b0ab-b738260f9af3', fieldMetadataUniversalIdentifier: OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, position: 5, isVisible: true, size: 160 },
  ],
  groups: INTERFAZE_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
