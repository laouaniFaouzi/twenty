import {
  nextChildPosition,
  orderSiblings,
  type PageSummary,
  UNTITLED_PAGE_TITLE,
} from 'src/utils/page-tree';
import { getEdgeNodes, type RecordApiClient } from 'src/utils/record-api-client';

// An agency keeps a few hundred pages at most; one page of results covers it.
const PAGE_LIMIT = 500;

export type PageAttachment = {
  objectName: 'project' | 'company' | 'opportunity';
  recordId: string;
};

type PageContent = { markdown: string | null; blocknote: string | null } | null;

type PageNode = Omit<PageSummary, 'isTemplate'> & { isTemplate: boolean | null };

const attachmentData = (attachment: PageAttachment | null) =>
  attachment ? { [`${attachment.objectName}Id`]: attachment.recordId } : {};

export const fetchPageSummaries = async (
  client: RecordApiClient,
): Promise<PageSummary[]> => {
  const response = await client.query({
    pages: {
      __args: { first: PAGE_LIMIT },
      edges: {
        node: {
          id: true,
          title: true,
          icon: true,
          position: true,
          parentPageId: true,
          isTemplate: true,
        },
      },
    },
  });

  return getEdgeNodes<PageNode>(response, 'pages').map((page) => ({
    ...page,
    isTemplate: page.isTemplate ?? false,
  }));
};

const createPageRecord = async (
  client: RecordApiClient,
  data: Record<string, unknown>,
): Promise<string> => {
  const response = await client.mutation({
    createPage: { __args: { data }, id: true },
  });

  return (response.createPage as { id: string }).id;
};

const nextPagePosition = (pages: PageSummary[], parentPageId: string | null) =>
  nextChildPosition(
    pages.filter((page) => !page.isTemplate),
    parentPageId,
  );

export const createPage = async (
  client: RecordApiClient,
  {
    parentPageId,
    attachment,
  }: { parentPageId: string | null; attachment: PageAttachment | null },
): Promise<{ pageId: string }> => {
  const pages = await fetchPageSummaries(client);

  const pageId = await createPageRecord(client, {
    title: UNTITLED_PAGE_TITLE,
    isTemplate: false,
    parentPageId,
    position: nextPagePosition(pages, parentPageId),
    ...attachmentData(attachment),
  });

  return { pageId };
};

const collectSubtreeIds = (pages: PageSummary[], rootId: string): string[] => {
  const collected = [rootId];
  const visited = new Set(collected);

  for (let index = 0; index < collected.length; index += 1) {
    for (const page of pages) {
      if (page.parentPageId === collected[index] && !visited.has(page.id)) {
        visited.add(page.id);
        collected.push(page.id);
      }
    }
  }

  return collected;
};

const fetchPageContents = async (
  client: RecordApiClient,
  pageIds: string[],
): Promise<Map<string, PageContent>> => {
  const response = await client.query({
    pages: {
      __args: { filter: { id: { in: pageIds } }, first: PAGE_LIMIT },
      edges: { node: { id: true, content: { markdown: true, blocknote: true } } },
    },
  });

  return new Map(
    getEdgeNodes<{ id: string; content: PageContent }>(response, 'pages').map(
      (page) => [page.id, page.content ?? null],
    ),
  );
};

export const copyPageTemplate = async (
  client: RecordApiClient,
  {
    templateId,
    parentPageId,
    attachment,
  }: {
    templateId: string;
    parentPageId: string | null;
    attachment: PageAttachment | null;
  },
): Promise<{ pageId: string }> => {
  const pages = await fetchPageSummaries(client);
  const template = pages.find((page) => page.id === templateId);

  if (!template) {
    throw new Error('Modèle introuvable');
  }

  const subtreeIds = collectSubtreeIds(pages, templateId);
  const contents = await fetchPageContents(client, subtreeIds);
  const copyData = (page: PageSummary) => ({
    title: page.title,
    icon: page.icon,
    content: contents.get(page.id) ?? null,
    isTemplate: false,
  });

  const rootCopyId = await createPageRecord(client, {
    ...copyData(template),
    parentPageId,
    position: nextPagePosition(pages, parentPageId),
    ...attachmentData(attachment),
  });

  const subtree = new Set(subtreeIds);
  const queue: [string, string][] = [[templateId, rootCopyId]];

  for (let index = 0; index < queue.length; index += 1) {
    const [sourceId, copyId] = queue[index];
    const children = orderSiblings(
      pages.filter((page) => page.parentPageId === sourceId && subtree.has(page.id)),
    );

    for (const [rank, child] of children.entries()) {
      subtree.delete(child.id);

      const childCopyId = await createPageRecord(client, {
        ...copyData(child),
        parentPageId: copyId,
        position: child.position ?? rank,
      });

      queue.push([child.id, childCopyId]);
    }
  }

  return { pageId: rootCopyId };
};
