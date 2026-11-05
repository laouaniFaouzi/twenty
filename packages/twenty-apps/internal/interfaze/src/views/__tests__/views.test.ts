import {
  NavigationMenuItemType,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import { OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-interfaze-stage.field';
import { OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-received-at.field';
import {
  MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-maintenance-contract.field';
import {
  PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-project-task.field';
import maintenanceNavigationMenuItem from 'src/navigation-menu-items/maintenance.navigation-menu-item';
import pipelineNavigationMenuItem from 'src/navigation-menu-items/pipeline.navigation-menu-item';
import projectTasksNavigationMenuItem from 'src/navigation-menu-items/project-tasks.navigation-menu-item';
import projectsNavigationMenuItem from 'src/navigation-menu-items/projects.navigation-menu-item';
import projectPageLayout from 'src/page-layouts/project.page-layout';
import maintenanceContractActiveView from 'src/views/maintenance-contract-active.view';
import maintenanceContractRenewalView from 'src/views/maintenance-contract-renewal.view';
import opportunityPipelineView, {
  OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/opportunity-pipeline.view';
import opportunityRequestsToHandleView from 'src/views/opportunity-requests-to-handle.view';
import projectByStatusView from 'src/views/project-by-status.view';
import projectContractsWidgetView, {
  PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/project-contracts-widget.view';
import projectInProgressView from 'src/views/project-in-progress.view';
import projectRecordPageFieldsView from 'src/views/project-record-page-fields.view';
import projectTaskMineView from 'src/views/project-task-mine.view';
import projectTaskOverdueView from 'src/views/project-task-overdue.view';
import projectTrackerTasksWidgetView, {
  PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/project-tracker-tasks-widget.view';

type ViewDefinition = typeof opportunityPipelineView;

const filtersOf = (definition: ViewDefinition) =>
  (definition.config.filters ?? []).map(({ operand, value }) => ({
    operand,
    value,
  }));

describe('Interfaze views', () => {
  it.each([
    ['pipeline', opportunityPipelineView, ViewType.KANBAN],
    ['requests to handle', opportunityRequestsToHandleView, ViewType.TABLE],
    ['projects in progress', projectInProgressView, ViewType.TABLE],
    ['projects by status', projectByStatusView, ViewType.KANBAN],
    ['project record page fields', projectRecordPageFieldsView, ViewType.FIELDS_WIDGET],
    ['project tracker tasks widget', projectTrackerTasksWidgetView, ViewType.TABLE_WIDGET],
    ['project contracts widget', projectContractsWidgetView, ViewType.TABLE_WIDGET],
    ['my tracker tasks', projectTaskMineView, ViewType.KANBAN],
    ['overdue tracker tasks', projectTaskOverdueView, ViewType.TABLE],
    ['active contracts', maintenanceContractActiveView, ViewType.TABLE],
    ['contracts to renew', maintenanceContractRenewalView, ViewType.TABLE],
  ])('defines the %s view', (_, definition, type) => {
    expect(definition.success).toBe(true);
    expect(definition.config.type).toBe(type);
    expect(definition.config.fields?.length).toBeGreaterThan(0);
  });

  it('groups the pipeline by Interfaze stage, in stage order', () => {
    expect(
      opportunityPipelineView.config.mainGroupByFieldMetadataUniversalIdentifier,
    ).toBe(OPPORTUNITY_INTERFAZE_STAGE_FIELD_UNIVERSAL_IDENTIFIER);
    expect(
      opportunityPipelineView.config.groups?.map((group) => group.fieldValue),
    ).toEqual(['NEW_REQUEST', 'DISCUSSION', 'QUOTE_SENT', 'WON', 'LOST']);
    expect(
      opportunityPipelineView.config.groups?.every((group) => group.isVisible),
    ).toBe(true);
  });

  it('lists new requests oldest first', () => {
    expect(filtersOf(opportunityRequestsToHandleView)).toEqual([
      { operand: ViewFilterOperand.IS, value: ['NEW_REQUEST'] },
    ]);
    expect(
      opportunityRequestsToHandleView.config.sorts?.map(
        ({ fieldMetadataUniversalIdentifier, direction }) => ({
          fieldMetadataUniversalIdentifier,
          direction,
        }),
      ),
    ).toEqual([
      {
        fieldMetadataUniversalIdentifier:
          OPPORTUNITY_RECEIVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
        direction: ViewSortDirection.ASC,
      },
    ]);
  });

  it('filters projects in progress', () => {
    expect(filtersOf(projectInProgressView)).toEqual([
      { operand: ViewFilterOperand.IS, value: ['IN_PROGRESS'] },
    ]);
  });

  it('shows the tracker tasks of the connected member', () => {
    expect(filtersOf(projectTaskMineView)).toEqual([
      {
        operand: ViewFilterOperand.IS,
        value: JSON.stringify({
          isCurrentWorkspaceMemberSelected: true,
          selectedRecordIds: [],
        }),
      },
    ]);
  });

  it('shows overdue tracker tasks that are not done', () => {
    expect(filtersOf(projectTaskOverdueView)).toEqual([
      { operand: ViewFilterOperand.IS_IN_PAST, value: '' },
      { operand: ViewFilterOperand.IS_NOT, value: ['DONE'] },
    ]);
  });

  it('shows active contracts, and those renewing within 30 days', () => {
    expect(filtersOf(maintenanceContractActiveView)).toEqual([
      { operand: ViewFilterOperand.IS, value: ['ACTIVE'] },
    ]);
    expect(filtersOf(maintenanceContractRenewalView)).toEqual([
      { operand: ViewFilterOperand.IS, value: ['ACTIVE'] },
      { operand: ViewFilterOperand.IS_RELATIVE, value: 'NEXT_30_DAY' },
    ]);
  });
});

const CURRENT_RECORD_FILTER_VALUE = JSON.stringify({
  selectedRecordIds: [],
  isCurrentRecordSelected: true,
});

describe('Record widget views', () => {
  it.each([
    ['tracker tasks', projectTrackerTasksWidgetView, PROJECT_ON_PROJECT_TASK_FIELD_UNIVERSAL_IDENTIFIER],
    ['contracts', projectContractsWidgetView, PROJECT_ON_MAINTENANCE_CONTRACT_FIELD_UNIVERSAL_IDENTIFIER],
  ])('scopes the %s widget to the open project', (_, definition, relationFieldId) => {
    expect(
      definition.config.filters?.map(({ fieldMetadataUniversalIdentifier, operand, value }) => ({
        fieldMetadataUniversalIdentifier,
        operand,
        value,
      })),
    ).toEqual([
      {
        fieldMetadataUniversalIdentifier: relationFieldId,
        operand: ViewFilterOperand.IS,
        value: CURRENT_RECORD_FILTER_VALUE,
      },
    ]);
  });
});

describe('Project record page', () => {
  it('has the Projet, Suivi, Contrats, Pages and Historique tabs in order', () => {
    expect(projectPageLayout.success).toBe(true);
    expect(projectPageLayout.config.type).toBe('RECORD_PAGE');
    expect(
      projectPageLayout.config.tabs?.map(({ title, position }) => [title, position]),
    ).toEqual([
      ['Projet', 10],
      ['Suivi', 20],
      ['Contrats', 30],
      ['Pages', 35],
      ['Historique', 40],
    ]);
  });

  it('scopes the Suivi and Contrats tabs to the open project', () => {
    const widgetConfiguration = (tabTitle: string) =>
      projectPageLayout.config.tabs?.find((tab) => tab.title === tabTitle)
        ?.widgets?.[0]?.configuration;

    expect(widgetConfiguration('Suivi')).toEqual({
      configurationType: 'FIELD',
      fieldMetadataId: TRACKER_TASKS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
      fieldDisplayMode: 'TABLE',
      viewId: PROJECT_TRACKER_TASKS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
    });
    expect(widgetConfiguration('Contrats')).toEqual({
      configurationType: 'FIELD',
      fieldMetadataId: MAINTENANCE_CONTRACTS_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
      fieldDisplayMode: 'TABLE',
      viewId: PROJECT_CONTRACTS_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
    });
  });
});

describe('Navigation', () => {
  it('opens the pipeline view first, then the Interfaze objects', () => {
    expect(pipelineNavigationMenuItem.config).toMatchObject({
      type: NavigationMenuItemType.VIEW,
      viewUniversalIdentifier: OPPORTUNITY_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
      name: 'Pipeline',
      position: 0,
    });
    expect(
      [projectsNavigationMenuItem, projectTasksNavigationMenuItem, maintenanceNavigationMenuItem].map(
        (item) => [item.success, item.config.type, item.config.position],
      ),
    ).toEqual([
      [true, NavigationMenuItemType.OBJECT, 1],
      [true, NavigationMenuItemType.OBJECT, 2],
      [true, NavigationMenuItemType.OBJECT, 3],
    ]);
  });
});
