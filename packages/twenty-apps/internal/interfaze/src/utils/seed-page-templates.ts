import { PAGE_SEEDS } from 'src/constants/page-templates';
import { fetchPageSummaries } from 'src/utils/page-records';
import { nextChildPosition, type PageSummary } from 'src/utils/page-tree';
import { type RecordApiClient } from 'src/utils/record-api-client';

// A seed already present, even edited or moved, is never touched again: the
// team owns the templates once they are installed.
export const seedPageTemplates = async (
  client: RecordApiClient,
): Promise<{ created: string[] }> => {
  const pages: PageSummary[] = await fetchPageSummaries(client);
  const created: string[] = [];

  for (const seed of PAGE_SEEDS) {
    const exists = pages.some(
      (page) => page.title === seed.title && page.isTemplate === seed.isTemplate,
    );

    if (exists) {
      continue;
    }

    const position = nextChildPosition(
      pages.filter((page) => page.isTemplate === seed.isTemplate),
      null,
    );

    const response = await client.mutation({
      createPage: {
        __args: {
          data: {
            title: seed.title,
            icon: seed.icon,
            isTemplate: seed.isTemplate,
            parentPageId: null,
            position,
            content: { markdown: seed.markdown, blocknote: null },
          },
        },
        id: true,
      },
    });

    pages.push({
      id: (response.createPage as { id: string }).id,
      title: seed.title,
      icon: seed.icon,
      position,
      parentPageId: null,
      isTemplate: seed.isTemplate,
    });
    created.push(seed.title);
  }

  return { created };
};
