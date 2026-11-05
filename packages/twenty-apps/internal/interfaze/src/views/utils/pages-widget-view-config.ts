import { type defineView, ViewType } from 'twenty-sdk/define';

import {
  PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/page.object';
import { currentRecordFilter } from 'src/views/utils/current-record-filter';

// TABLE_WIDGET keeps these views out of the record index view pickers.
export const pagesWidgetViewConfig = ({
  universalIdentifier,
  name,
  relationFieldUniversalIdentifier,
  titleFieldUniversalIdentifier,
  iconFieldUniversalIdentifier,
  filterUniversalIdentifier,
}: {
  universalIdentifier: string;
  name: string;
  relationFieldUniversalIdentifier: string;
  titleFieldUniversalIdentifier: string;
  iconFieldUniversalIdentifier: string;
  filterUniversalIdentifier: string;
}): Parameters<typeof defineView>[0] => ({
  universalIdentifier,
  name,
  icon: 'IconNotes',
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE_WIDGET,
  fields: [
    { universalIdentifier: titleFieldUniversalIdentifier, fieldMetadataUniversalIdentifier: PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 320 },
    { universalIdentifier: iconFieldUniversalIdentifier, fieldMetadataUniversalIdentifier: PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 100 },
  ],
  filters: [currentRecordFilter(filterUniversalIdentifier, relationFieldUniversalIdentifier)],
});
