import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';

import { PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  ActionButton,
  notifyError,
  openPage,
  pageLabel,
  type Palette,
  recordApiClient,
  TemplatePicker,
  usePalette,
  useSingleFlight,
} from 'src/front-components/page-ui';
import { PAGES_TEST_IDS } from 'src/front-components/pages-test-ids';
import {
  copyPageTemplate,
  createPage,
  fetchPageSummaries,
} from 'src/utils/page-records';
import {
  buildPageTree,
  computeSiblingReorder,
  type PageSummary,
  type PageTreeNode,
} from 'src/utils/page-tree';

type TreeRowProps = {
  node: PageTreeNode;
  siblings: PageTreeNode[];
  depth: number;
  expanded: Set<string>;
  palette: Palette;
  withActions: boolean;
  isBusy: boolean;
  onToggle: (pageId: string) => void;
  onAddSubPage: (node: PageTreeNode) => void;
  onMove: (
    node: PageTreeNode,
    siblings: PageTreeNode[],
    direction: 'up' | 'down',
  ) => void;
};

const TreeRow = (props: TreeRowProps) => {
  const { node, siblings, depth, expanded, palette, withActions, isBusy } =
    props;
  const isExpanded = expanded.has(node.id);
  const index = siblings.findIndex((sibling) => sibling.id === node.id);

  return (
    <div>
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${palette.border}`,
          display: 'flex',
          gap: '6px',
          padding: `4px 4px 4px ${depth * 20 + 4}px`,
        }}
      >
        <button
          type="button"
          aria-label={isExpanded ? 'Replier' : 'Déplier'}
          onClick={() => props.onToggle(node.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: palette.muted,
            cursor: node.children.length > 0 ? 'pointer' : 'default',
            visibility: node.children.length > 0 ? 'visible' : 'hidden',
            width: '20px',
          }}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          onClick={() => openPage(node.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: palette.text,
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            padding: '2px 0',
            textAlign: 'left',
          }}
        >
          {pageLabel(node)}
        </button>
        {withActions && (
          <>
            <ActionButton
              label="+"
              title="Ajouter une sous-page"
              testId={PAGES_TEST_IDS.addSubPage}
              palette={palette}
              disabled={isBusy}
              onClick={() => props.onAddSubPage(node)}
            />
            <ActionButton
              label="↑"
              title="Monter"
              testId={PAGES_TEST_IDS.moveUp}
              palette={palette}
              disabled={isBusy || index <= 0}
              onClick={() => props.onMove(node, siblings, 'up')}
            />
            <ActionButton
              label="↓"
              title="Descendre"
              testId={PAGES_TEST_IDS.moveDown}
              palette={palette}
              disabled={isBusy || index === siblings.length - 1}
              onClick={() => props.onMove(node, siblings, 'down')}
            />
          </>
        )}
      </div>
      {isExpanded &&
        node.children.map((child) => (
          <TreeRow
            {...props}
            key={child.id}
            node={child}
            siblings={node.children}
            depth={depth + 1}
          />
        ))}
    </div>
  );
};

const PagesTree = () => {
  const palette = usePalette();
  const [pages, setPages] = useState<PageSummary[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isPickingTemplate, setIsPickingTemplate] = useState(false);
  const [areTemplatesOpen, setAreTemplatesOpen] = useState(false);
  const { isBusy, run } = useSingleFlight();

  const loadPages = useCallback(async () => {
    try {
      setPages(await fetchPageSummaries(recordApiClient()));
    } catch {
      await notifyError("Les pages n'ont pas pu être chargées.");
    }
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const toggle = (pageId: string) =>
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }

      return next;
    });

  const createAndOpen = (parentPageId: string | null) =>
    run(async () => {
      try {
        const { pageId } = await createPage(recordApiClient(), {
          parentPageId,
          attachment: null,
        });
        await openPage(pageId);
      } catch {
        await notifyError("La page n'a pas pu être créée.");
      }
    });

  const copyAndOpen = (template: PageSummary) =>
    run(async () => {
      setIsPickingTemplate(false);

      try {
        const { pageId } = await copyPageTemplate(recordApiClient(), {
          templateId: template.id,
          parentPageId: null,
          attachment: null,
        });
        await openPage(pageId);
      } catch {
        await notifyError("Le modèle n'a pas pu être copié.");
      }
    });

  const move = (
    node: PageTreeNode,
    siblings: PageTreeNode[],
    direction: 'up' | 'down',
  ) =>
    run(async () => {
      const client = recordApiClient();

      try {
        for (const { id, position } of computeSiblingReorder(
          siblings,
          node.id,
          direction,
        )) {
          await client.mutation({
            updatePage: { __args: { id, data: { position } }, id: true },
          });
        }
        await loadPages();
      } catch {
        await notifyError("L'ordre des pages n'a pas pu être modifié.");
      }
    });

  if (pages === null) {
    return (
      <div style={{ color: palette.muted, padding: '12px' }}>Chargement…</div>
    );
  }

  const { roots, templates } = buildPageTree(pages);
  const rowProps = {
    expanded,
    palette,
    isBusy,
    onToggle: toggle,
    onAddSubPage: (node: PageTreeNode) => createAndOpen(node.id),
    onMove: move,
  };

  return (
    <div
      data-testid={PAGES_TEST_IDS.tree}
      style={{ color: palette.text, fontFamily: 'inherit', padding: '8px' }}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <ActionButton
          primary
          label="Nouvelle page"
          testId={PAGES_TEST_IDS.newPage}
          palette={palette}
          disabled={isBusy}
          onClick={() => createAndOpen(null)}
        />
        <ActionButton
          label="Depuis un modèle"
          testId={PAGES_TEST_IDS.newFromTemplate}
          palette={palette}
          disabled={isBusy}
          onClick={() => setIsPickingTemplate(true)}
        />
      </div>
      {isPickingTemplate && (
        <TemplatePicker
          templates={templates}
          palette={palette}
          onPick={copyAndOpen}
          onCancel={() => setIsPickingTemplate(false)}
        />
      )}
      {roots.length === 0 && (
        <p style={{ color: palette.muted, fontSize: '13px' }}>
          Aucune page pour l'instant.
        </p>
      )}
      {roots.map((node) => (
        <TreeRow
          {...rowProps}
          key={node.id}
          node={node}
          siblings={roots}
          depth={0}
          withActions
        />
      ))}
      <div
        data-testid={PAGES_TEST_IDS.templatesSection}
        style={{ marginTop: '16px' }}
      >
        <button
          type="button"
          onClick={() => setAreTemplatesOpen((open) => !open)}
          style={{
            background: 'transparent',
            border: 'none',
            color: palette.muted,
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 0',
          }}
        >
          {areTemplatesOpen ? '▾' : '▸'} Modèles ({templates.length})
        </button>
        {areTemplatesOpen &&
          templates.map((node) => (
            <TreeRow
              {...rowProps}
              key={node.id}
              node={node}
              siblings={templates}
              depth={0}
              withActions={false}
            />
          ))}
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: PAGES_TREE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'pages-tree',
  description: 'Arborescence des pages, avec création, ordre et modèles',
  component: PagesTree,
});
