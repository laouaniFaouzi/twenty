import { defineView, ViewType } from 'twenty-sdk/define';

import {
  PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/page.object';

export const RECORD_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER = '48f21a26-3933-48e7-97b6-9ccaffcf3490';

// TABLE_WIDGET keeps this view out of the record index view pickers.
export default defineView({
  universalIdentifier: RECORD_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Pages de la fiche',
  icon: 'IconNotes',
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE_WIDGET,
  fields: [
    { universalIdentifier: 'bb4717cb-df5e-4df9-9de1-5307082dc235', fieldMetadataUniversalIdentifier: PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER, position: 0, isVisible: true, size: 320 },
    { universalIdentifier: '3f3ecb13-80cf-4585-a696-16522cd4c9d4', fieldMetadataUniversalIdentifier: PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER, position: 1, isVisible: true, size: 100 },
  ],
});
