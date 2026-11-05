import { describe, expect, it } from 'vitest';

import {
  buildPageTree,
  computeSiblingReorder,
  nextChildPosition,
  orderSiblings,
  type PageSummary,
  type PageTreeNode,
} from 'src/utils/page-tree';

const page = (
  id: string,
  overrides: Partial<PageSummary> = {},
): PageSummary => ({
  id,
  title: id,
  icon: null,
  position: 0,
  parentPageId: null,
  isTemplate: false,
  ...overrides,
});

const ids = (nodes: PageTreeNode[]) => nodes.map((node) => node.id);

const allIds = (nodes: PageTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.id, ...allIds(node.children)]);

describe('orderSiblings', () => {
  it('sorts by position, null last, then by title', () => {
    expect(
      orderSiblings([
        page('b', { position: null }),
        page('c', { position: 1 }),
        page('Zèbre', { position: 0 }),
        page('Abeille', { position: 0 }),
        page('untitled', { position: 0, title: null }),
      ]).map((sibling) => sibling.title),
    ).toEqual(['Abeille', null, 'Zèbre', 'c', 'b']);
  });
});

describe('buildPageTree', () => {
  it('splits root pages from root templates and nests children in order', () => {
    const tree = buildPageTree([
      page('root-b', { position: 1 }),
      page('root-a', { position: 0 }),
      page('child-2', { parentPageId: 'root-a', position: 2 }),
      page('child-1', { parentPageId: 'root-a', position: 1 }),
      page('template', { isTemplate: true }),
    ]);

    expect(ids(tree.roots)).toEqual(['root-a', 'root-b']);
    expect(ids(tree.roots[0].children)).toEqual(['child-1', 'child-2']);
    expect(ids(tree.templates)).toEqual(['template']);
  });

  it('shows a page whose parent is missing at the root', () => {
    const tree = buildPageTree([page('orphan', { parentPageId: 'deleted' })]);

    expect(ids(tree.roots)).toEqual(['orphan']);
  });

  it('keeps the descendants of a template under it, out of the main tree', () => {
    const tree = buildPageTree([
      page('template', { isTemplate: true }),
      page('template-child', { parentPageId: 'template' }),
      page('template-grandchild', { parentPageId: 'template-child' }),
    ]);

    expect(tree.roots).toEqual([]);
    expect(allIds(tree.templates)).toEqual([
      'template',
      'template-child',
      'template-grandchild',
    ]);
  });

  it('shows the pages of a cycle at the root, each exactly once', () => {
    const tree = buildPageTree([
      page('a', { parentPageId: 'b' }),
      page('b', { parentPageId: 'a', position: 1 }),
      page('c', { parentPageId: 'a' }),
    ]);

    expect(ids(tree.roots)).toEqual(['a', 'b']);
    expect(allIds(tree.roots).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('computeSiblingReorder', () => {
  const siblings = [
    page('first', { position: 0 }),
    page('second', { position: 1 }),
    page('third', { position: 2 }),
  ];

  it('swaps a page with the one above it', () => {
    expect(computeSiblingReorder(siblings, 'third', 'up')).toEqual([
      { id: 'third', position: 1 },
      { id: 'second', position: 2 },
    ]);
  });

  it('does nothing at either end', () => {
    expect(computeSiblingReorder(siblings, 'first', 'up')).toEqual([]);
    expect(computeSiblingReorder(siblings, 'third', 'down')).toEqual([]);
  });

  it('renumbers siblings that share a position before swapping', () => {
    const tied = [page('C'), page('A'), page('B')];
    const updates = computeSiblingReorder(tied, 'A', 'down');
    const positions = new Map(tied.map((sibling) => [sibling.id, sibling.position]));

    for (const { id, position } of updates) {
      positions.set(id, position);
    }

    expect(
      orderSiblings(tied.map((sibling) => ({ ...sibling, position: positions.get(sibling.id) ?? null }))).map(
        (sibling) => sibling.id,
      ),
    ).toEqual(['B', 'A', 'C']);
    expect(updates.every(({ id, position }) => tied.find((sibling) => sibling.id === id)?.position !== position)).toBe(true);
  });
});

describe('nextChildPosition', () => {
  it('starts at 0 and otherwise follows the highest sibling position', () => {
    expect(nextChildPosition([], null)).toBe(0);
    expect(
      nextChildPosition(
        [
          page('a', { position: 0 }),
          page('b', { position: 3 }),
          page('child', { parentPageId: 'a', position: 9 }),
        ],
        null,
      ),
    ).toBe(4);
    expect(nextChildPosition([page('a', { position: null })], null)).toBe(1);
    expect(
      nextChildPosition([page('a'), page('child', { parentPageId: 'a', position: 5 })], 'a'),
    ).toBe(6);
  });
});
