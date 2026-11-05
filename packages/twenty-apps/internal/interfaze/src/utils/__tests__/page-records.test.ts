import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { copyPageTemplate, createPage } from 'src/utils/page-records';
import { type PageSummary } from 'src/utils/page-tree';

let client: MockRecordApiClient;

const summary = (id: string, overrides: Partial<PageSummary> = {}): PageSummary => ({
  id,
  title: id,
  icon: null,
  position: 0,
  parentPageId: null,
  isTemplate: false,
  ...overrides,
});

const givenPages = (pages: (PageSummary & { content?: unknown })[]) => {
  client.query.mockImplementation(async (request) => {
    const filterIds = (request.pages as { __args?: { filter?: { id?: { in?: string[] } } } })
      ?.__args?.filter?.id?.in;

    return {
      pages: connection(filterIds ? pages.filter((page) => filterIds.includes(page.id)) : pages),
    };
  });
};

beforeEach(() => {
  client = createMockRecordApiClient();
  let created = 0;
  client.mutation.mockImplementation(async (request) => {
    if ('createPage' in request) {
      created += 1;

      return { createPage: { id: `copy-${created}` } };
    }

    return {};
  });
});

describe('createPage', () => {
  it('creates an untitled page at the end of the root pages', async () => {
    givenPages([summary('a', { position: 0 }), summary('b', { position: 3 })]);

    expect(await createPage(client, { parentPageId: null, attachment: null })).toEqual({
      pageId: 'copy-1',
    });
    expect(mutationArgs(client, 'createPage')).toEqual([
      { data: { title: 'Sans titre', isTemplate: false, parentPageId: null, position: 4 } },
    ]);
  });

  it('ignores templates when placing a new root page', async () => {
    givenPages([summary('a', { position: 0 }), summary('template', { position: 7, isTemplate: true })]);

    await createPage(client, { parentPageId: null, attachment: null });

    expect(mutationArgs(client, 'createPage')[0]).toMatchObject({ data: { position: 1 } });
  });

  it('attaches the page to the record it is created from', async () => {
    givenPages([]);

    await createPage(client, {
      parentPageId: null,
      attachment: { objectName: 'project', recordId: 'p1' },
    });

    expect(mutationArgs(client, 'createPage')[0]).toEqual({
      data: { title: 'Sans titre', isTemplate: false, parentPageId: null, position: 0, projectId: 'p1' },
    });
  });
});

describe('copyPageTemplate', () => {
  const TEMPLATE_CONTENT = { markdown: '## A', blocknote: '[{"type":"heading"}]' };

  beforeEach(() => {
    givenPages([
      summary('existing-root', { position: 2 }),
      { ...summary('T', { title: 'Brief projet', icon: '🎯', isTemplate: true }), content: TEMPLATE_CONTENT },
      { ...summary('T1', { parentPageId: 'T', position: 1 }), content: { markdown: 'one', blocknote: null } },
      { ...summary('T0', { parentPageId: 'T', position: 0 }), content: { markdown: 'zero', blocknote: null } },
      { ...summary('T0a', { parentPageId: 'T0', position: 0 }), content: { markdown: 'deep', blocknote: null } },
    ]);
  });

  it('copies the template and its sub-pages level by level, never as templates', async () => {
    const result = await copyPageTemplate(client, {
      templateId: 'T',
      parentPageId: null,
      attachment: { objectName: 'company', recordId: 'c1' },
    });

    expect(result).toEqual({ pageId: 'copy-1' });
    expect(mutationArgs(client, 'createPage')).toEqual([
      {
        data: {
          title: 'Brief projet',
          icon: '🎯',
          content: TEMPLATE_CONTENT,
          isTemplate: false,
          parentPageId: null,
          position: 3,
          companyId: 'c1',
        },
      },
      {
        data: {
          title: 'T0',
          icon: null,
          content: { markdown: 'zero', blocknote: null },
          isTemplate: false,
          parentPageId: 'copy-1',
          position: 0,
        },
      },
      {
        data: {
          title: 'T1',
          icon: null,
          content: { markdown: 'one', blocknote: null },
          isTemplate: false,
          parentPageId: 'copy-1',
          position: 1,
        },
      },
      {
        data: {
          title: 'T0a',
          icon: null,
          content: { markdown: 'deep', blocknote: null },
          isTemplate: false,
          parentPageId: 'copy-2',
          position: 0,
        },
      },
    ]);
  });

  it('places the copy under the requested parent', async () => {
    await copyPageTemplate(client, { templateId: 'T', parentPageId: 'existing-root', attachment: null });

    expect(mutationArgs(client, 'createPage')[0]).toMatchObject({
      data: { parentPageId: 'existing-root', position: 0 },
    });
  });

  it('rejects an unknown template', async () => {
    await expect(
      copyPageTemplate(client, { templateId: 'missing', parentPageId: null, attachment: null }),
    ).rejects.toThrow('Modèle introuvable');
  });
});
