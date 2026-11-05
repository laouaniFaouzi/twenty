import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import { PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER,
  PAGE_UNIVERSAL_IDENTIFIER,
} from 'src/objects/page.object';
import { PAGE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/page-record-page-fields.view';

export default definePageLayout({
  universalIdentifier: '2bf57777-b70e-4f7f-9929-c79bc852262f',
  name: 'Fiche page',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: '350d99df-f34d-466f-8cd5-9dd099b7e42c',
      title: 'Page',
      position: 10,
      icon: 'IconNotes',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '5079a99e-36ac-44fe-91ef-f40a1eb93356',
          title: 'Navigation',
          type: 'FRONT_COMPONENT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
        {
          universalIdentifier: '604efc10-f13c-41f4-a399-17c9486c5455',
          title: 'Contenu',
          type: 'FIELD',
          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId: PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER,
            fieldDisplayMode: 'EDITOR',
          },
        },
      ],
    },
    {
      universalIdentifier: '5c8fb1d4-a21a-40e6-b392-079c6388eba9',
      title: 'Infos',
      position: 20,
      icon: 'IconInfoCircle',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '043dad8e-9b0e-4ba5-94d2-cacf16a57d57',
          title: 'Infos',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: PAGE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: 'ffdbc38f-93a9-42a1-a32c-ccd921f8a356',
      title: 'Historique',
      position: 30,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'c9e2eb28-3a83-4715-b2d0-d44cb74f7b5c',
          title: 'Historique',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
