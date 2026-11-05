export type PageSummary = {
  id: string;
  title: string | null;
  icon: string | null;
  position: number | null;
  parentPageId: string | null;
  isTemplate: boolean;
};

export type PageTreeNode = PageSummary & { children: PageTreeNode[] };

export const UNTITLED_PAGE_TITLE = 'Sans titre';

type Orderable = { title: string | null; position: number | null };

export const orderSiblings = <TPage extends Orderable>(pages: TPage[]): TPage[] =>
  [...pages].sort((first, second) => {
    if (first.position !== second.position) {
      if (first.position === null) return 1;
      if (second.position === null) return -1;

      return first.position - second.position;
    }

    return (first.title ?? UNTITLED_PAGE_TITLE).localeCompare(
      second.title ?? UNTITLED_PAGE_TITLE,
      'fr',
    );
  });

const isOnCycle = (pageId: string, pagesById: Map<string, PageSummary>): boolean => {
  const visited = new Set<string>();
  let current = pagesById.get(pageId)?.parentPageId ?? null;

  while (current !== null && !visited.has(current)) {
    if (current === pageId) {
      return true;
    }

    visited.add(current);
    current = pagesById.get(current)?.parentPageId ?? null;
  }

  return false;
};

export const buildPageTree = (
  pages: PageSummary[],
): { roots: PageTreeNode[]; templates: PageTreeNode[] } => {
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const nodesById = new Map<string, PageTreeNode>(
    pages.map((page) => [page.id, { ...page, children: [] }]),
  );
  const rootNodes: PageTreeNode[] = [];

  for (const page of pages) {
    const node = nodesById.get(page.id) as PageTreeNode;
    const parentNode =
      page.parentPageId !== null && !isOnCycle(page.id, pagesById)
        ? nodesById.get(page.parentPageId)
        : undefined;

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  for (const node of nodesById.values()) {
    node.children = orderSiblings(node.children);
  }

  const orderedRoots = orderSiblings(rootNodes);

  return {
    roots: orderedRoots.filter((node) => !node.isTemplate),
    templates: orderedRoots.filter((node) => node.isTemplate),
  };
};

export const computeSiblingReorder = (
  siblings: PageSummary[],
  pageId: string,
  direction: 'up' | 'down',
): { id: string; position: number }[] => {
  const ordered = orderSiblings(siblings);
  const index = ordered.findIndex((sibling) => sibling.id === pageId);
  const neighborIndex = direction === 'up' ? index - 1 : index + 1;

  if (index === -1 || neighborIndex < 0 || neighborIndex >= ordered.length) {
    return [];
  }

  // Siblings can share a position; renumbering in display order first makes
  // the swap visible whatever the stored positions were.
  const newPositions = new Map(ordered.map((sibling, rank) => [sibling.id, rank]));
  newPositions.set(ordered[index].id, neighborIndex);
  newPositions.set(ordered[neighborIndex].id, index);

  const changeOrder = [
    ordered[index],
    ordered[neighborIndex],
    ...ordered.filter((_, rank) => rank !== index && rank !== neighborIndex),
  ];

  return changeOrder
    .map((sibling) => ({ id: sibling.id, position: newPositions.get(sibling.id) as number }))
    .filter(
      ({ id, position }) =>
        siblings.find((sibling) => sibling.id === id)?.position !== position,
    );
};

export const nextChildPosition = (
  pages: PageSummary[],
  parentPageId: string | null,
): number => {
  const siblingPositions = pages
    .filter((page) => page.parentPageId === parentPageId)
    .map((page) => page.position ?? 0);

  return siblingPositions.length === 0 ? 0 : Math.max(...siblingPositions) + 1;
};
