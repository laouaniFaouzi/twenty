import {
  AggregateOperations,
  definePageLayout,
  PageLayoutTabLayoutMode,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-interfaze-stage.field';
import { OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-received-at.field';
import { OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-request-source.field';
import { OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-response-overdue.field';
import {
  MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-contract.object';
import {
  PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project.object';
import {
  PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/objects/project-task.object';
import {
  SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_UNIVERSAL_IDENTIFIER,
} from 'src/objects/sync-log.object';
import {
  chartFilter,
  isAnyOf,
  isInPast,
  isNoneOf,
  isRelative,
  isTrue,
  relativeDate,
  withinLast,
} from 'src/page-layouts/utils/chart-filters';
import { AGENCY_TIME_ZONE } from 'src/utils/agency-date';

const OPPORTUNITY = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity;
const OPPORTUNITY_NAME = OPPORTUNITY.fields.name.universalIdentifier;
const OPPORTUNITY_AMOUNT = OPPORTUNITY.fields.amount.universalIdentifier;

const CHART_CALENDAR = {
  timezone: AGENCY_TIME_ZONE,
  firstDayOfTheWeek: 1,
} as const;

const tile = (
  row: number,
  column: number,
  columnSpan: number,
  rowSpan: number,
) => ({
  layoutMode: PageLayoutTabLayoutMode.GRID as const,
  row,
  column,
  columnSpan,
  rowSpan,
});

const count = (fieldUniversalIdentifier: string) => ({
  configurationType: 'AGGREGATE_CHART' as const,
  aggregateFieldMetadataUniversalIdentifier: fieldUniversalIdentifier,
  aggregateOperation: AggregateOperations.COUNT,
  displayDataLabel: true,
  ...CHART_CALENDAR,
});

const sum = (fieldUniversalIdentifier: string) => ({
  ...count(fieldUniversalIdentifier),
  aggregateOperation: AggregateOperations.SUM,
});

export default definePageLayout({
  universalIdentifier: PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Pilotage',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '560927e0-f479-42e1-af80-d696ddd573db',
      title: 'Pilotage',
      position: 0,
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: 'd0c43650-5f06-4ea2-a0ec-98df1b2300be',
          title: 'Nouvelles demandes sur 7 jours',
          type: 'GRAPH',
          objectUniversalIdentifier: OPPORTUNITY.universalIdentifier,
          position: tile(0, 0, 3, 2),
          configuration: {
            ...count(OPPORTUNITY_NAME),
            filter: chartFilter([], {
              groupId: 'acf8e2f3-9129-49c2-a810-e18ef0535598',
              filters: withinLast(
                OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
                7,
                'DAY',
              ),
            }),
          },
        },
        {
          universalIdentifier: 'a15c45ec-3ec1-4384-b1d7-737a49ffbaec',
          title: 'Demandes sans réponse après 48 h',
          type: 'GRAPH',
          objectUniversalIdentifier: OPPORTUNITY.universalIdentifier,
          position: tile(0, 3, 3, 2),
          configuration: {
            ...count(OPPORTUNITY_NAME),
            // The stage drops an answered request at once; the flag only follows hourly.
            filter: chartFilter([
              isAnyOf(OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, [
                'NEW_REQUEST',
              ]),
              isTrue(OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER),
            ]),
          },
        },
        {
          universalIdentifier: '4f475a4b-8689-46cf-a19e-36a4915b7a54',
          title: 'Montant signé ce mois',
          type: 'GRAPH',
          objectUniversalIdentifier: OPPORTUNITY.universalIdentifier,
          position: tile(0, 6, 3, 2),
          configuration: {
            ...sum(OPPORTUNITY_AMOUNT),
            filter: chartFilter([
              isAnyOf(OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, [
                'WON',
              ]),
              isRelative(
                OPPORTUNITY.fields.closeDate.universalIdentifier,
                relativeDate('THIS', 1, 'MONTH'),
              ),
            ]),
          },
        },
        {
          universalIdentifier: 'c77146a3-46c8-4822-80a7-9812e30f7cd9',
          title: 'Revenu récurrent mensuel',
          type: 'GRAPH',
          objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
          position: tile(0, 9, 3, 2),
          configuration: {
            ...sum(
              MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
            ),
            filter: chartFilter([
              isAnyOf(MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, [
                'ACTIVE',
              ]),
            ]),
          },
        },
        {
          universalIdentifier: '34cd03af-2055-4bdf-a8a5-a4246d8d9eca',
          title: 'Pipeline par étape (montants)',
          type: 'GRAPH',
          objectUniversalIdentifier: OPPORTUNITY.universalIdentifier,
          position: tile(2, 0, 6, 6),
          configuration: {
            configurationType: 'BAR_CHART',
            aggregateFieldMetadataUniversalIdentifier: OPPORTUNITY_AMOUNT,
            aggregateOperation: AggregateOperations.SUM,
            primaryAxisGroupByFieldMetadataUniversalIdentifier:
              OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
            primaryAxisOrderBy: 'FIELD_POSITION_ASC',
            // Otherwise every stage shows, Signé and Perdu as empty bars.
            omitNullValues: true,
            layout: 'VERTICAL',
            axisNameDisplay: 'NONE',
            displayDataLabel: true,
            ...CHART_CALENDAR,
            filter: chartFilter([
              isAnyOf(OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, [
                'NEW_REQUEST',
                'DISCUSSION',
                'QUOTE_SENT',
              ]),
            ]),
          },
        },
        {
          universalIdentifier: '34e17c8f-49f9-47bb-8e28-7bf587e4db18',
          title: 'Projets en cours par offre',
          type: 'GRAPH',
          objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
          position: tile(2, 6, 6, 6),
          configuration: {
            configurationType: 'PIE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
            aggregateOperation: AggregateOperations.COUNT,
            groupByFieldMetadataUniversalIdentifier:
              PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
            displayLegend: true,
            hideEmptyCategory: true,
            ...CHART_CALENDAR,
            filter: chartFilter([
              isAnyOf(PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, [
                'IN_PROGRESS',
              ]),
            ]),
          },
        },
        {
          universalIdentifier: '0141a92f-e7b1-4ecd-b553-58235d86b2e6',
          title: 'Demandes par source sur 6 mois',
          type: 'GRAPH',
          objectUniversalIdentifier: OPPORTUNITY.universalIdentifier,
          position: tile(8, 0, 6, 6),
          configuration: {
            configurationType: 'BAR_CHART',
            aggregateFieldMetadataUniversalIdentifier: OPPORTUNITY_NAME,
            aggregateOperation: AggregateOperations.COUNT,
            primaryAxisGroupByFieldMetadataUniversalIdentifier:
              OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
            primaryAxisOrderBy: 'FIELD_POSITION_ASC',
            omitNullValues: true,
            layout: 'VERTICAL',
            axisNameDisplay: 'NONE',
            displayDataLabel: true,
            ...CHART_CALENDAR,
            filter: chartFilter([], {
              groupId: '27888710-bc36-4104-94ed-8535ce120b90',
              filters: withinLast(
                OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
                6,
                'MONTH',
              ),
            }),
          },
        },
        {
          universalIdentifier: '5f8b79f2-99f7-46ef-96e6-c85eb4651fdb',
          title: 'Tâches de suivi en retard',
          type: 'GRAPH',
          objectUniversalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
          position: tile(8, 6, 6, 2),
          configuration: {
            ...count(PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER),
            filter: chartFilter([
              isInPast(PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER),
              isNoneOf(PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER, [
                'DONE',
              ]),
            ]),
          },
        },
        {
          universalIdentifier: '9a27007f-cc85-48b1-a7ab-3b9a385178d1',
          title: 'Contrats à renouveler sous 30 jours',
          type: 'GRAPH',
          objectUniversalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
          position: tile(10, 6, 6, 2),
          configuration: {
            ...count(MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER),
            // Late renewals count too, as they do for the renewal tasks.
            filter: chartFilter(
              [
                isAnyOf(
                  MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
                  ['ACTIVE'],
                ),
              ],
              {
                groupId: '20e8f10d-cdb7-47b0-96d4-c4faadd33aca',
                filters: [
                  isInPast(
                    MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
                  ),
                  isRelative(
                    MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
                    relativeDate('THIS', 1, 'DAY'),
                  ),
                  isRelative(
                    MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
                    relativeDate('NEXT', 30, 'DAY'),
                  ),
                ],
              },
            ),
          },
        },
        {
          universalIdentifier: '5fbae982-4486-4618-a21f-0ffc9a9dc62c',
          title: 'Erreurs de synchro sur 24 h',
          type: 'GRAPH',
          objectUniversalIdentifier: SYNC_LOG_UNIVERSAL_IDENTIFIER,
          position: tile(12, 6, 6, 2),
          configuration: {
            ...count(SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER),
            filter: chartFilter([], {
              groupId: '30172ccb-4e01-4cd4-b7d7-7c6b560c8ed7',
              filters: withinLast(
                SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
                24,
                'HOUR',
              ),
            }),
          },
        },
      ],
    },
  ],
});
