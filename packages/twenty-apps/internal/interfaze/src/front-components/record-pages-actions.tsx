import { useState } from 'react';
import { useRecordId } from 'twenty-sdk/front-component';

import {
  ActionButton,
  notifyError,
  openPage,
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
  type PageAttachment,
} from 'src/utils/page-records';
import { buildPageTree, type PageSummary } from 'src/utils/page-tree';

type RecordPagesActionsProps = { objectName: PageAttachment['objectName'] };

export const RecordPagesActions = ({ objectName }: RecordPagesActionsProps) => {
  const palette = usePalette();
  const recordId = useRecordId();
  const [templates, setTemplates] = useState<PageSummary[] | null>(null);
  const [isPickingTemplate, setIsPickingTemplate] = useState(false);
  const { isBusy, run } = useSingleFlight();

  const attachment: PageAttachment | null = recordId
    ? { objectName, recordId }
    : null;

  const startPickingTemplate = () =>
    run(async () => {
      try {
        setTemplates(
          buildPageTree(await fetchPageSummaries(recordApiClient())).templates,
        );
        setIsPickingTemplate(true);
      } catch {
        await notifyError("Les modèles n'ont pas pu être chargés.");
      }
    });

  const createAndOpen = () =>
    run(async () => {
      try {
        const { pageId } = await createPage(recordApiClient(), {
          parentPageId: null,
          attachment,
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
          attachment,
        });
        await openPage(pageId);
      } catch {
        await notifyError("Le modèle n'a pas pu être copié.");
      }
    });

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionButton
          primary
          label="Nouvelle page"
          testId={PAGES_TEST_IDS.recordNewPage}
          palette={palette}
          disabled={isBusy || attachment === null}
          onClick={createAndOpen}
        />
        <ActionButton
          label="Depuis un modèle"
          testId={PAGES_TEST_IDS.recordNewFromTemplate}
          palette={palette}
          disabled={isBusy || attachment === null}
          onClick={startPickingTemplate}
        />
      </div>
      {isPickingTemplate && templates !== null && (
        <TemplatePicker
          templates={templates}
          palette={palette}
          onPick={copyAndOpen}
          onCancel={() => setIsPickingTemplate(false)}
        />
      )}
    </div>
  );
};
