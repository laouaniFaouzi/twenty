import {
  NavigationMenuItemType,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import {
  COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/company-on-page.field';
import {
  OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
  PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/opportunity-on-page.field';
import {
  PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/project-on-page.field';
import pagesNavigationMenuItem from 'src/navigation-menu-items/pages.navigation-menu-item';
import { PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import companyPagesTab from 'src/page-layout-tabs/company-pages.page-layout-tab';
import opportunityPagesTab from 'src/page-layout-tabs/opportunity-pages.page-layout-tab';
import pagePageLayout from 'src/page-layouts/page.page-layout';
import pagesPageLayout from 'src/page-layouts/pages.page-layout';
import projectPageLayout from 'src/page-layouts/project.page-layout';
import companyPagesWidgetView, {
  COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/company-pages-widget.view';
import opportunityPagesWidgetView, {
  OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/opportunity-pages-widget.view';
import projectPagesWidgetView, {
  PROJECT_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/views/project-pages-widget.view';

const tabsOf = (layout: typeof projectPageLayout) =>
  layout.config.tabs?.map(({ title, position }) => [title, position]);

const frontComponentOf = (widget: { configuration?: unknown } | undefined) =>
  (widget?.configuration as { frontComponentUniversalIdentifier?: string })
    ?.frontComponentUniversalIdentifier;

describe('Page record page', () => {
  it('has the Page, Infos and Historique tabs', () => {
    expect(pagePageLayout.success).toBe(true);
    expect(tabsOf(pagePageLayout)).toEqual([
      ['Page', 10],
      ['Infos', 20],
      ['Historique', 30],
    ]);
  });

  it('shows the header component, then the content in a full editor', () => {
    const [header, content] = pagePageLayout.config.tabs?.[0].widgets ?? [];

    expect(frontComponentOf(header)).toBe(PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER);
    expect(content?.configuration).toEqual({
      configurationType: 'FIELD',
      fieldMetadataId: PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER,
      fieldDisplayMode: 'EDITOR',
    });
  });
});

describe('Pages page', () => {
  it('is a standalone page with the pages tree', () => {
    expect(pagesPageLayout.success).toBe(true);
    expect(pagesPageLayout.config.universalIdentifier).toBe(PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER);
    expect(pagesPageLayout.config.type).toBe('STANDALONE_PAGE');
    expect(frontComponentOf(pagesPageLayout.config.tabs?.[0].widgets?.[0])).toBe(
      PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
    );
  });

  it('opens from the menu after the lot 1 items', () => {
    expect(pagesNavigationMenuItem.success).toBe(true);
    expect(pagesNavigationMenuItem.config).toMatchObject({
      type: NavigationMenuItemType.PAGE_LAYOUT,
      pageLayoutUniversalIdentifier: PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
      name: 'Pages',
      position: 5,
    });
  });
});

describe('Pages tabs on records', () => {
  const pagesTabWidgets = (widgets: { configuration?: unknown }[] | undefined) => ({
    actions: frontComponentOf(widgets?.[0]),
    list: widgets?.[1]?.configuration,
  });

  it('adds a Pages tab to the project record page', () => {
    expect(tabsOf(projectPageLayout)).toEqual([
      ['Projet', 10],
      ['Suivi', 20],
      ['Contrats', 30],
      ['Pages', 35],
      ['Historique', 40],
    ]);
    const pagesTab = projectPageLayout.config.tabs?.find((tab) => tab.title === 'Pages');

    expect(pagesTabWidgets(pagesTab?.widgets)).toEqual({
      actions: PROJECT_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      list: {
        configurationType: 'FIELD',
        fieldMetadataId: PAGES_ON_PROJECT_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
        viewId: PROJECT_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER,
      },
    });
  });

  it.each([
    [companyPagesTab, STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.universalIdentifier, COMPANY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER, PAGES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER, COMPANY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER],
    [opportunityPagesTab, STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.universalIdentifier, OPPORTUNITY_PAGES_ACTIONS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER, PAGES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER, OPPORTUNITY_PAGES_WIDGET_VIEW_UNIVERSAL_IDENTIFIER],
  ])('adds a Pages tab to standard record page %#', (tab, layoutId, actionsId, pagesFieldId, viewId) => {
    expect(tab.success).toBe(true);
    expect(tab.config).toMatchObject({
      pageLayoutUniversalIdentifier: layoutId,
      title: 'Pages',
      position: 1000,
    });
    expect(pagesTabWidgets(tab.config.widgets)).toEqual({
      actions: actionsId,
      list: {
        configurationType: 'FIELD',
        fieldMetadataId: pagesFieldId,
        fieldDisplayMode: 'TABLE',
        viewId,
      },
    });
  });
});

describe('Pages widget views', () => {
  it.each([
    ['project', projectPagesWidgetView, PROJECT_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER],
    ['company', companyPagesWidgetView, COMPANY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER],
    ['opportunity', opportunityPagesWidgetView, OPPORTUNITY_ON_PAGE_FIELD_UNIVERSAL_IDENTIFIER],
  ])('lists only the pages attached to the open %s', (_, definition, relationFieldId) => {
    expect(definition.success).toBe(true);
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
        value: JSON.stringify({ selectedRecordIds: [], isCurrentRecordSelected: true }),
      },
    ]);
  });
});
