import {
  AggregateOperations,
  PageLayoutTabLayoutMode,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

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
import pilotagePageLayout from 'src/page-layouts/pilotage.page-layout';

const OPPORTUNITY = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity;
const OPPORTUNITY_NAME = OPPORTUNITY.fields.name.universalIdentifier;
const OPPORTUNITY_AMOUNT = OPPORTUNITY.fields.amount.universalIdentifier;
const OPPORTUNITY_CLOSE_DATE = OPPORTUNITY.fields.closeDate.universalIdentifier;

const PARIS = ';;Europe/Paris;;MONDAY;;';

type ChartConfiguration = {
  configurationType: string;
  aggregateOperation: AggregateOperations;
  aggregateFieldMetadataUniversalIdentifier: string;
  primaryAxisGroupByFieldMetadataUniversalIdentifier?: string;
  groupByFieldMetadataUniversalIdentifier?: string;
  filter?: {
    recordFilters?: {
      fieldMetadataUniversalIdentifier: string;
      operand: string;
      value?: string | null;
      recordFilterGroupId?: string | null;
    }[];
    recordFilterGroups?: { id: string; logicalOperator: string }[];
  };
};

const widgets = pilotagePageLayout.config.tabs?.[0]?.widgets ?? [];

const widgetTitled = (title: string) => {
  const widget = widgets.find((candidate) => candidate.title === title);

  if (!widget) {
    throw new Error(`No widget titled ${title}`);
  }

  return widget;
};

const configurationOf = (title: string) =>
  widgetTitled(title).configuration as unknown as ChartConfiguration;

// [field, operand, value, in the OR group]
const filtersOf = (title: string) => {
  const filter = configurationOf(title).filter ?? {};
  const groupIds = (filter.recordFilterGroups ?? []).map(({ id }) => id);

  return (filter.recordFilters ?? []).map(
    ({ fieldMetadataUniversalIdentifier, operand, value, recordFilterGroupId }) => [
      fieldMetadataUniversalIdentifier,
      operand,
      value,
      recordFilterGroupId !== undefined &&
        recordFilterGroupId !== null &&
        groupIds.includes(recordFilterGroupId),
    ],
  );
};

const WIDGETS: [string, string, string, AggregateOperations, string, number[]][] = [
  ['Nouvelles demandes sur 7 jours', OPPORTUNITY.universalIdentifier, 'AGGREGATE_CHART', AggregateOperations.COUNT, OPPORTUNITY_NAME, [0, 0, 3, 2]],
  ['Demandes sans réponse après 48 h', OPPORTUNITY.universalIdentifier, 'AGGREGATE_CHART', AggregateOperations.COUNT, OPPORTUNITY_NAME, [0, 3, 3, 2]],
  ['Montant signé ce mois', OPPORTUNITY.universalIdentifier, 'AGGREGATE_CHART', AggregateOperations.SUM, OPPORTUNITY_AMOUNT, [0, 6, 3, 2]],
  ['Revenu récurrent mensuel', MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER, 'AGGREGATE_CHART', AggregateOperations.SUM, MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER, [0, 9, 3, 2]],
  ['Pipeline par étape (montants)', OPPORTUNITY.universalIdentifier, 'BAR_CHART', AggregateOperations.SUM, OPPORTUNITY_AMOUNT, [2, 0, 6, 6]],
  ['Projets en cours par offre', PROJECT_UNIVERSAL_IDENTIFIER, 'PIE_CHART', AggregateOperations.COUNT, PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER, [2, 6, 6, 6]],
  ['Demandes par source sur 6 mois', OPPORTUNITY.universalIdentifier, 'BAR_CHART', AggregateOperations.COUNT, OPPORTUNITY_NAME, [8, 0, 6, 6]],
  ['Tâches de suivi en retard', PROJECT_TASK_UNIVERSAL_IDENTIFIER, 'AGGREGATE_CHART', AggregateOperations.COUNT, PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER, [8, 6, 6, 2]],
  ['Contrats à renouveler sous 30 jours', MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER, 'AGGREGATE_CHART', AggregateOperations.COUNT, MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER, [10, 6, 6, 2]],
  ['Erreurs de synchro sur 24 h', SYNC_LOG_UNIVERSAL_IDENTIFIER, 'AGGREGATE_CHART', AggregateOperations.COUNT, SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER, [12, 6, 6, 2]],
];

describe('Pilotage dashboard', () => {
  it('is a standalone page named Pilotage with one grid tab', () => {
    expect(pilotagePageLayout.success).toBe(true);
    expect(pilotagePageLayout.config).toMatchObject({
      universalIdentifier: PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
      name: 'Pilotage',
      type: 'STANDALONE_PAGE',
    });
    expect(pilotagePageLayout.config.tabs).toHaveLength(1);
    expect(pilotagePageLayout.config.tabs?.[0]).toMatchObject({
      title: 'Pilotage',
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.GRID,
    });
    expect(widgets.map(({ title }) => title)).toEqual(
      WIDGETS.map(([title]) => title),
    );
  });

  it.each(WIDGETS)(
    '%s reads the right object and figure',
    (title, objectUniversalIdentifier, configurationType, aggregateOperation, aggregateField) => {
      expect(widgetTitled(title)).toMatchObject({
        type: 'GRAPH',
        objectUniversalIdentifier,
      });
      expect(configurationOf(title)).toMatchObject({
        configurationType,
        aggregateOperation,
        aggregateFieldMetadataUniversalIdentifier: aggregateField,
      });
    },
  );

  it('lays the widgets out in the three rows of the spec', () => {
    expect(
      widgets.map(({ position }) => {
        const grid = position as { row: number; column: number; columnSpan: number; rowSpan: number };

        return [grid.row, grid.column, grid.columnSpan, grid.rowSpan];
      }),
    ).toEqual(WIDGETS.map(([, , , , , position]) => position));
  });

  it('counts requests received today and the six days before', () => {
    expect(filtersOf('Nouvelles demandes sur 7 jours')).toEqual([
      [OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `PAST_6_DAY${PARIS}`, true],
      [OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `THIS_1_DAY${PARIS}`, true],
    ]);
    expect(
      configurationOf('Nouvelles demandes sur 7 jours').filter?.recordFilterGroups,
    ).toEqual([{ id: expect.any(String), logicalOperator: 'OR' }]);
  });

  it('counts overdue requests only while they wait at Nouvelle demande', () => {
    expect(filtersOf('Demandes sans réponse après 48 h')).toEqual([
      [OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["NEW_REQUEST"]', false],
      [OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, 'true', false],
    ]);
  });

  it('sums the deals signed this month', () => {
    expect(filtersOf('Montant signé ce mois')).toEqual([
      [OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["WON"]', false],
      [OPPORTUNITY_CLOSE_DATE, ViewFilterOperand.IS_RELATIVE, `THIS_1_MONTH${PARIS}`, false],
    ]);
  });

  it('sums the monthly amounts of active contracts', () => {
    expect(filtersOf('Revenu récurrent mensuel')).toEqual([
      [MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["ACTIVE"]', false],
    ]);
  });

  it('leaves lost and signed deals out of the pipeline, in stage order', () => {
    expect(configurationOf('Pipeline par étape (montants)')).toMatchObject({
      primaryAxisGroupByFieldMetadataUniversalIdentifier: OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      primaryAxisOrderBy: 'FIELD_POSITION_ASC',
    });
    expect(filtersOf('Pipeline par étape (montants)')).toEqual([
      [OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["NEW_REQUEST","DISCUSSION","QUOTE_SENT"]', false],
    ]);
  });

  it('splits projects in progress by offer', () => {
    expect(configurationOf('Projets en cours par offre')).toMatchObject({
      groupByFieldMetadataUniversalIdentifier: PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
    });
    expect(filtersOf('Projets en cours par offre')).toEqual([
      [PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["IN_PROGRESS"]', false],
    ]);
  });

  it('splits the requests of this month and the five before by source', () => {
    expect(configurationOf('Demandes par source sur 6 mois')).toMatchObject({
      primaryAxisGroupByFieldMetadataUniversalIdentifier: OPPORTUNITY_REQUEST_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      omitNullValues: true,
    });
    expect(filtersOf('Demandes par source sur 6 mois')).toEqual([
      [OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `PAST_5_MONTH${PARIS}`, true],
      [OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `THIS_1_MONTH${PARIS}`, true],
    ]);
  });

  it('counts tracker tasks past due and not done', () => {
    expect(filtersOf('Tâches de suivi en retard')).toEqual([
      [PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_IN_PAST, '', false],
      [PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_NOT, '["DONE"]', false],
    ]);
  });

  it('counts contracts to renew within 30 days, late ones and today included', () => {
    expect(filtersOf('Contrats à renouveler sous 30 jours')).toEqual([
      [MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS, '["ACTIVE"]', false],
      [MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_IN_PAST, '', true],
      [MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `THIS_1_DAY${PARIS}`, true],
      [MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `NEXT_30_DAY${PARIS}`, true],
    ]);
  });

  it('counts sync errors of the last 24 hours', () => {
    expect(filtersOf('Erreurs de synchro sur 24 h')).toEqual([
      [SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `PAST_23_HOUR${PARIS}`, true],
      [SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER, ViewFilterOperand.IS_RELATIVE, `THIS_1_HOUR${PARIS}`, true],
    ]);
  });

  it('gives every filter group its own identifier', () => {
    const groupIds = widgets.flatMap(
      ({ title }) =>
        configurationOf(title).filter?.recordFilterGroups?.map(({ id }) => id) ?? [],
    );

    expect(groupIds).toHaveLength(4);
    expect(new Set(groupIds).size).toBe(4);
  });
});
