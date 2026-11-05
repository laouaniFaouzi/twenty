import { ViewFilterOperand } from 'twenty-sdk/define';

// A FIELD widget in TABLE mode only provides the open record; the widget view
// must filter on the relation back to it, as the front does for widgets built
// in the UI, or the table lists every record of the object.
export const currentRecordFilter = (
  universalIdentifier: string,
  fieldMetadataUniversalIdentifier: string,
) => ({
  universalIdentifier,
  fieldMetadataUniversalIdentifier,
  operand: ViewFilterOperand.IS,
  value: JSON.stringify({ selectedRecordIds: [], isCurrentRecordSelected: true }),
});
