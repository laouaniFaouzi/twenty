import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { useRecordId } from 'twenty-sdk/front-component';

import { PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  ActionButton,
  notifyError,
  openPage,
  openPagesHome,
  pageLabel,
  recordApiClient,
  usePalette,
  useSingleFlight,
} from 'src/front-components/page-ui';
import { PAGES_TEST_IDS } from 'src/front-components/pages-test-ids';
import { createPage, fetchPageSummaries } from 'src/utils/page-records';
import { orderSiblings, type PageSummary } from 'src/utils/page-tree';

const ancestorsOf = (pageId: string, pages: PageSummary[]): PageSummary[] => {
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const ancestors: PageSummary[] = [];
  const visited = new Set([pageId]);
  let parentId = pagesById.get(pageId)?.parentPageId ?? null;

  while (parentId !== null && !visited.has(parentId)) {
    const parent = pagesById.get(parentId);

    if (!parent) {
      break;
    }

    visited.add(parentId);
    ancestors.unshift(parent);
    parentId = parent.parentPageId;
  }

  return ancestors;
};

const PageHeader = () => {
  const palette = usePalette();
  const pageId = useRecordId();
  const [pages, setPages] = useState<PageSummary[]>([]);
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

  if (!pageId) {
    return null;
  }

  const current = pages.find((page) => page.id === pageId);
  const ancestors = ancestorsOf(pageId, pages);
  const subPages = orderSiblings(
    pages.filter((page) => page.parentPageId === pageId),
  );

  const addSubPage = () =>
    run(async () => {
      try {
        const created = await createPage(recordApiClient(), {
          parentPageId: pageId,
          attachment: null,
        });
        await openPage(created.pageId);
      } catch {
        await notifyError("La page n'a pas pu être créée.");
      }
    });

  const crumbStyle = {
    background: 'transparent',
    border: 'none',
    color: palette.muted,
    cursor: 'pointer',
    fontSize: '13px',
    padding: 0,
  };

  return (
    <div style={{ color: palette.text, padding: '8px 4px' }}>
      <div
        data-testid={PAGES_TEST_IDS.breadcrumb}
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <button
          type="button"
          style={crumbStyle}
          onClick={() => openPagesHome()}
        >
          Pages
        </button>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: palette.muted }}>›</span>
            <button
              type="button"
              style={crumbStyle}
              onClick={() => openPage(ancestor.id)}
            >
              {pageLabel(ancestor)}
            </button>
          </span>
        ))}
        {current && (
          <span style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: palette.muted }}>›</span>
            <span style={{ fontSize: '13px' }}>{pageLabel(current)}</span>
          </span>
        )}
      </div>
      <div
        data-testid={PAGES_TEST_IDS.subPages}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '8px',
        }}
      >
        {subPages.map((subPage) => (
          <ActionButton
            key={subPage.id}
            label={pageLabel(subPage)}
            palette={palette}
            onClick={() => openPage(subPage.id)}
          />
        ))}
        <ActionButton
          label="+ sous-page"
          testId={PAGES_TEST_IDS.addSubPage}
          palette={palette}
          disabled={isBusy}
          onClick={addSubPage}
        />
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: PAGE_HEADER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'page-header',
  description: "Fil d'Ariane et sous-pages d'une page",
  component: PageHeader,
});
