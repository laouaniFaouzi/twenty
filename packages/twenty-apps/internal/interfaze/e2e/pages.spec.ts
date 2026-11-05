import { expect, type Locator, type Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { PAGES_TEST_IDS } from '../src/front-components/pages-test-ids';
import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from '../src/utils/record-api-client';

const WORKSPACE_ORIGIN_FILE = path.resolve(__dirname, '.auth', 'workspace-origin.txt');
const SCREENSHOT_DIR = path.resolve(__dirname, '.results', 'screenshots');

const COMPANY_NAME = '[e2e-pages] Fleuriste';
const PROCESS_TITLE = '[e2e-pages] Process';

const workspaceUrl = (): string => {
  try {
    return fs.readFileSync(WORKSPACE_ORIGIN_FILE, 'utf8').trim().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3001';
  }
};

const shoot = async (page: Page, name: string) => {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
};

const pageIdFromUrl = (page: Page): string => {
  const match = page.url().match(/\/object\/page\/([0-9a-f-]{36})/);

  if (!match) {
    throw new Error(`Not on a page record: ${page.url()}`);
  }

  return match[1];
};

const waitForPageRecordUrl = async (page: Page, previousId?: string) => {
  await page.waitForURL(
    (url) =>
      /\/object\/page\/[0-9a-f-]{36}/.test(url.pathname) &&
      (!previousId || !url.pathname.includes(previousId)),
  );

  return pageIdFromUrl(page);
};

// Twenty marks the widget container that hosts app components aria-disabled,
// which fails Playwright's "enabled" check although a real click works, so
// clicks inside components skip that check once the target is visible.
const clickInComponent = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  await locator.click({ force: true });
};

let client: RecordApiClient;
let companyId: string;
let opportunityId: string;
let projectId: string;
const createdPageIds: string[] = [];

test.beforeAll(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  client = toRecordApiClient(new CoreApiClient());

  const company = await client.mutation({
    createCompany: { __args: { data: { name: COMPANY_NAME } }, id: true },
  });
  companyId = (company.createCompany as { id: string }).id;

  const opportunity = await client.mutation({
    createOpportunity: {
      __args: {
        data: { name: '[e2e-pages] Site', companyId, offer: 'WEB', interfazeStage: 'QUOTE_SENT' },
      },
      id: true,
    },
  });
  opportunityId = (opportunity.createOpportunity as { id: string }).id;

  await client.mutation({
    updateOpportunity: {
      __args: { id: opportunityId, data: { interfazeStage: 'WON' } },
      id: true,
    },
  });

  await expect
    .poll(
      async () =>
        getEdgeNodes<{ id: string }>(
          await client.query({
            projects: {
              __args: { filter: { opportunityId: { eq: opportunityId } } },
              edges: { node: { id: true } },
            },
          }),
          'projects',
        )[0]?.id,
      { timeout: 60_000 },
    )
    .toBeTruthy();
  projectId = opportunityId;
});

test.afterAll(async () => {
  const projectPages = getEdgeNodes<{ id: string }>(
    await client.query({
      pages: {
        __args: { filter: { projectId: { eq: projectId } } },
        edges: { node: { id: true } },
      },
    }),
    'pages',
  );

  for (const id of [...createdPageIds, ...projectPages.map((node) => node.id)]) {
    await client.mutation({ destroyPage: { __args: { id }, id: true } }).catch(() => {});
  }

  await client
    .mutation({ destroyOpportunity: { __args: { id: opportunityId }, id: true } })
    .catch(() => {});
  await client
    .mutation({ destroyCompany: { __args: { id: companyId }, id: true } })
    .catch(() => {});
});

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));
});

test('pages: tree, sub-page, breadcrumb and template from a project', async ({ page }) => {
  await page.goto(`${workspaceUrl()}/`);

  await page.getByText('Pages', { exact: true }).first().click();
  const tree = page.getByTestId(PAGES_TEST_IDS.tree);
  await expect(tree).toBeVisible();
  await expect(tree.getByText('Créer une base de données')).toBeVisible();
  await shoot(page, '1-pages-tree');

  await clickInComponent(page.getByTestId(PAGES_TEST_IDS.newPage));
  const processId = await waitForPageRecordUrl(page);
  createdPageIds.push(processId);
  await expect(page.getByTestId(PAGES_TEST_IDS.breadcrumb)).toContainText('Sans titre');
  await shoot(page, '2-new-page');

  await client.mutation({
    updatePage: { __args: { id: processId, data: { title: PROCESS_TITLE } }, id: true },
  });

  await clickInComponent(
    page.getByTestId(PAGES_TEST_IDS.breadcrumb).getByRole('button', { name: 'Pages', exact: true }),
  );
  await expect(tree).toBeVisible();

  await clickInComponent(
    tree
      .getByRole('button', { name: PROCESS_TITLE, exact: true })
      .locator('xpath=..')
      .getByTestId(PAGES_TEST_IDS.addSubPage),
  );
  const subPageId = await waitForPageRecordUrl(page, processId);
  createdPageIds.push(subPageId);
  const breadcrumb = page.getByTestId(PAGES_TEST_IDS.breadcrumb);
  await expect(breadcrumb).toContainText('Pages');
  await expect(breadcrumb).toContainText(PROCESS_TITLE);
  await shoot(page, '3-sub-page');

  await clickInComponent(breadcrumb.getByRole('button', { name: 'Pages', exact: true }));
  await expect(tree).toBeVisible();

  await page.goto(`${workspaceUrl()}/object/project/${projectId}`);
  await page.getByText('Pages', { exact: true }).last().click();
  await clickInComponent(page.getByTestId(PAGES_TEST_IDS.recordNewFromTemplate));
  await clickInComponent(
    page.getByTestId(PAGES_TEST_IDS.templateOption).filter({ hasText: 'Brief projet' }),
  );
  const briefId = await waitForPageRecordUrl(page);
  createdPageIds.push(briefId);
  await expect(page.getByTestId(PAGES_TEST_IDS.breadcrumb)).toContainText('Brief projet');
  await expect(page.getByText('Le client et son activité').first()).toBeVisible();
  await shoot(page, '4-brief-from-template');

  await page.goto(`${workspaceUrl()}/object/project/${projectId}`);
  await page.getByText('Pages', { exact: true }).last().click();
  await expect(page.getByText('Brief projet').first()).toBeVisible();
  // Only the pages attached to this project are listed.
  await expect(page.getByText('Créer une base de données')).toHaveCount(0);
  await shoot(page, '5-project-pages-tab');
});
