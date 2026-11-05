import { beforeEach, describe, expect, it } from 'vitest';

import {
  connection,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { PAGE_SEEDS } from 'src/constants/page-templates';
import { seedPageTemplates } from 'src/utils/seed-page-templates';

type StoredPage = { id: string; title: string; isTemplate: boolean; parentPageId: null; position: number; icon: string };

let client: MockRecordApiClient;
let storedPages: StoredPage[];

beforeEach(() => {
  client = createMockRecordApiClient();
  storedPages = [];
  client.query.mockImplementation(async () => ({ pages: connection(storedPages) }));
  client.mutation.mockImplementation(async (request) => {
    const data = request.createPage.__args.data as StoredPage;
    const id = `page-${storedPages.length + 1}`;
    storedPages.push({ ...data, id });

    return { createPage: { id } };
  });
});

describe('seedPageTemplates', () => {
  it('creates the templates and the help page in an empty workspace', async () => {
    const result = await seedPageTemplates(client);

    expect(result.created).toEqual(PAGE_SEEDS.map((seed) => seed.title));
    expect(mutationArgs(client, 'createPage')).toEqual(
      PAGE_SEEDS.map((seed, index) => ({
        data: {
          title: seed.title,
          icon: seed.icon,
          isTemplate: seed.isTemplate,
          parentPageId: null,
          position: seed.isTemplate ? index : 0,
          content: { markdown: seed.markdown, blocknote: null },
        },
      })),
    );
  });

  it('never recreates nor overwrites a page that already exists, even edited', async () => {
    storedPages = [
      { id: 'edited', title: 'Brief projet', isTemplate: true, parentPageId: null, position: 0, icon: '✏️' },
      { id: 'help', title: 'Créer une base de données', isTemplate: false, parentPageId: null, position: 4, icon: '🗂️' },
    ];

    const result = await seedPageTemplates(client);

    expect(result.created).toEqual([
      'Compte rendu de réunion',
      'Cahier des charges',
      'Bilan de mise en ligne',
    ]);
    expect(client.mutation.mock.calls.every(([request]) => 'createPage' in request)).toBe(true);
  });

  it('does not duplicate anything when run twice', async () => {
    await seedPageTemplates(client);
    const second = await seedPageTemplates(client);

    expect(second.created).toEqual([]);
    expect(storedPages).toHaveLength(PAGE_SEEDS.length);
  });

  it('treats a regular page that shares a template title as a different page', async () => {
    storedPages = [
      { id: 'mine', title: 'Brief projet', isTemplate: false, parentPageId: null, position: 0, icon: '' },
    ];

    expect((await seedPageTemplates(client)).created).toContain('Brief projet');
  });
});
