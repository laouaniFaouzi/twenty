import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { copyPageTemplate } from 'src/utils/page-records';
import { seedPageTemplates } from 'src/utils/seed-page-templates';
import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from 'src/utils/record-api-client';

type PageNode = {
  id: string;
  title: string | null;
  isTemplate: boolean | null;
  parentPageId: string | null;
  content: { markdown: string | null; blocknote: string | null } | null;
};

const PAGE_FIELDS = {
  id: true,
  title: true,
  isTemplate: true,
  parentPageId: true,
  content: { markdown: true, blocknote: true },
};

let client: RecordApiClient;
const createdPageIds: string[] = [];

const waitFor = async <TValue>(
  check: () => Promise<TValue | undefined>,
  timeoutMs = 60_000,
): Promise<TValue> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await check();

    if (value !== undefined) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Condition not met within ${timeoutMs} ms`);
};

const pagesWhere = async (filter: Record<string, unknown>): Promise<PageNode[]> =>
  getEdgeNodes<PageNode>(
    await client.query({
      pages: { __args: { filter, first: 100 }, edges: { node: PAGE_FIELDS } },
    }),
    'pages',
  );

const createPageRecord = async (data: Record<string, unknown>): Promise<string> => {
  const response = await client.mutation({
    createPage: { __args: { data }, id: true },
  });
  const id = (response.createPage as { id: string }).id;
  createdPageIds.push(id);

  return id;
};

// A dev sync does not run the post-install hook (a real install does, server
// side), and executing it through the API needs a permission the test key
// lacks, so the hook's work is run directly.
beforeAll(async () => {
  client = toRecordApiClient(new CoreApiClient());
  await seedPageTemplates(client);
});

afterAll(async () => {
  for (const id of createdPageIds) {
    await client
      .mutation({ destroyPage: { __args: { id }, id: true } })
      .catch(() => {});
  }
});

describe('Interfaze pages', () => {
  it('installs the templates only once', async () => {
    expect((await seedPageTemplates(client)).created).toEqual([]);
  });

  it('installs the four templates and the database help page', async () => {
    const templates = await pagesWhere({ isTemplate: { eq: true } });

    expect(templates.map((page) => page.title).sort()).toEqual(
      ['Bilan de mise en ligne', 'Brief projet', 'Cahier des charges', 'Compte rendu de réunion'],
    );

    const [help] = await pagesWhere({ title: { eq: 'Créer une base de données' } });

    expect(help.isTemplate).toBe(false);
    expect(help.content?.markdown).toContain('Modèle de données');
    expect(help.content?.blocknote).toBeTruthy();
  });

  it('copies a template, its sub-pages and its content', async () => {
    const [brief] = await pagesWhere({ title: { eq: 'Brief projet' }, isTemplate: { eq: true } });
    const subPageId = await createPageRecord({
      title: '[test-pages] Annexe',
      parentPageId: brief.id,
      content: { markdown: '## Annexe', blocknote: null },
    });

    const { pageId } = await copyPageTemplate(client, {
      templateId: brief.id,
      parentPageId: null,
      attachment: null,
    });
    createdPageIds.push(pageId);

    const [copy] = await pagesWhere({ id: { eq: pageId } });
    const copiedChildren = await pagesWhere({ parentPageId: { eq: pageId } });
    createdPageIds.push(...copiedChildren.map((page) => page.id));

    expect(copy).toMatchObject({ title: 'Brief projet', isTemplate: false, parentPageId: null });
    expect(copy.content?.markdown).toContain('Le client et son activité');
    expect(copy.content?.blocknote).toBeTruthy();
    expect(copiedChildren.map((page) => page.title)).toEqual(['[test-pages] Annexe']);
    expect(copiedChildren[0].id).not.toBe(subPageId);
  });

  it('moves the sub-pages of a deleted page up to its parent', async () => {
    const grandParentId = await createPageRecord({ title: '[test-pages] Racine' });
    const parentId = await createPageRecord({ title: '[test-pages] Parente', parentPageId: grandParentId });
    const childId = await createPageRecord({ title: '[test-pages] Enfant', parentPageId: parentId });

    await client.mutation({ deletePage: { __args: { id: parentId }, id: true } });

    const child = await waitFor(async () => {
      const [node] = await pagesWhere({ id: { eq: childId } });

      return node?.parentPageId === grandParentId ? node : undefined;
    });

    expect(child.parentPageId).toBe(grandParentId);
  });
});
