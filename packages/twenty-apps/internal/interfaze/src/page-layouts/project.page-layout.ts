import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import { PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-page.field';
import { MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-maintenance-contract.field';
import { TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/project-on-project-task.field';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import { PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/project-contracts-widget.view';
import { PROJECT_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/project-record-page-fields.view';
import { PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/project-tracker-tasks-widget.view';
import { RECORD_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/record-pages-widget.view';

export const PROJECT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER = 'ec1a0927-bec7-4c8b-9477-2d3ca6ff4dfe';

export default definePageLayout({
  universalIdentifier: PROJECT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Fiche projet',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: 'd6ad6214-6a15-4eec-b3b1-a4d7cbb6bda1',
      title: 'Projet',
      position: 10,
      icon: 'IconBriefcase',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '9666dd16-0a75-4ee0-8429-894f2193a087',
          title: 'Champs',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: PROJECT_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: 'aa7e11b1-b1da-4589-bccf-180eaab8dedc',
      title: 'Suivi',
      position: 20,
      icon: 'IconChecklist',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '48fe661c-bac7-4370-9fe2-8f722546ff4e',
          title: 'Tâches de suivi',
          type: 'FIELD',
          // A FIELD widget in TABLE mode is the only configuration scoped to the
          // open record; a RECORD_TABLE widget would list every tracker task.
          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId: TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
            fieldDisplayMode: 'TABLE',
            viewId: PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: '479b6333-37c3-42cb-8c52-ae2d86140bf0',
      title: 'Contrats',
      position: 30,
      icon: 'IconTool',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'ad300643-23f5-4be8-9e50-a949d9eb67fe',
          title: 'Contrats de maintenance',
          type: 'FIELD',
          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId: MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
            fieldDisplayMode: 'TABLE',
            viewId: PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: '7365f1b2-d0b5-42ef-8eb4-01dd2dedcca1',
      title: 'Pages',
      position: 35,
      icon: 'IconNotes',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '687241ce-52c0-4a49-aadd-898e0f2eca97',
          title: 'Nouvelle page',
          type: 'FRONT_COMPONENT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
        {
          universalIdentifier: '0763aca0-fdcb-4f74-8fc1-29342f0073ca',
          title: 'Pages',
          type: 'FIELD',
          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId: PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
            fieldDisplayMode: 'TABLE',
            viewId: RECORD_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: 'c2c29968-a94e-44b0-afd7-0fddcf44a7ef',
      title: 'Historique',
      position: 40,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '98d04569-5ac4-4771-9a8e-bf0c9b4c4ad8',
          title: 'Historique',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
