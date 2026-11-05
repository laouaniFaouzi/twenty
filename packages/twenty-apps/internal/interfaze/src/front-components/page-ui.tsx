import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  AppPath,
  enqueueSnackbar,
  navigate,
  useColorScheme,
} from 'twenty-sdk/front-component';

import { PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PAGES_TEST_IDS } from 'src/front-components/pages-test-ids';
import { type PageSummary, UNTITLED_PAGE_TITLE } from 'src/utils/page-tree';
import { type RecordApiClient, toRecordApiClient } from 'src/utils/record-api-client';

export type Palette = {
  text: string;
  muted: string;
  border: string;
  hover: string;
  accent: string;
  accentText: string;
};

const LIGHT: Palette = {
  text: '#333333',
  muted: '#818181',
  border: '#ebebeb',
  hover: '#f1f1f1',
  accent: '#1961ed',
  accentText: '#ffffff',
};

const DARK: Palette = {
  text: '#ebebeb',
  muted: '#999999',
  border: '#333333',
  hover: '#262626',
  accent: '#4a7cf0',
  accentText: '#ffffff',
};

export const usePalette = (): Palette =>
  useColorScheme() === 'dark' ? DARK : LIGHT;

export const recordApiClient = (): RecordApiClient =>
  toRecordApiClient(new CoreApiClient());

export const openPage = (pageId: string) =>
  navigate(AppPath.RecordShowPage, {
    objectNameSingular: 'page',
    objectRecordId: pageId,
  });

export const openPagesHome = () =>
  navigate(AppPath.PageLayoutPage, {
    pageLayoutId: PAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  });

export const notifyError = (message: string) =>
  enqueueSnackbar({ message, variant: 'error' });

export const pageLabel = (page: Pick<PageSummary, 'icon' | 'title'>) =>
  `${page.icon ? `${page.icon} ` : ''}${page.title || UNTITLED_PAGE_TITLE}`;

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  palette: Palette;
  testId?: string;
  title?: string;
  disabled?: boolean;
  primary?: boolean;
};

export const ActionButton = ({
  label,
  onClick,
  palette,
  testId,
  title,
  disabled = false,
  primary = false,
}: ActionButtonProps) => (
  <button
    type="button"
    data-testid={testId}
    title={title}
    disabled={disabled}
    onClick={onClick}
    style={{
      backgroundColor: primary ? palette.accent : 'transparent',
      border: `1px solid ${primary ? palette.accent : palette.border}`,
      borderRadius: '4px',
      color: primary ? palette.accentText : palette.text,
      cursor: disabled ? 'default' : 'pointer',
      fontSize: '13px',
      opacity: disabled ? 0.4 : 1,
      padding: '4px 8px',
    }}
  >
    {label}
  </button>
);

type TemplatePickerProps = {
  templates: PageSummary[];
  palette: Palette;
  onPick: (template: PageSummary) => void;
  onCancel: () => void;
};

export const TemplatePicker = ({
  templates,
  palette,
  onPick,
  onCancel,
}: TemplatePickerProps) => (
  <div
    data-testid={PAGES_TEST_IDS.templatePicker}
    style={{
      border: `1px solid ${palette.border}`,
      borderRadius: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      margin: '8px 0',
      padding: '8px',
    }}
  >
    <span style={{ color: palette.muted, fontSize: '12px' }}>
      Choisissez un modèle
    </span>
    {templates.length === 0 && (
      <span style={{ color: palette.muted, fontSize: '13px' }}>
        Aucun modèle pour l'instant.
      </span>
    )}
    {templates.map((template) => (
      <button
        key={template.id}
        type="button"
        data-testid={PAGES_TEST_IDS.templateOption}
        onClick={() => onPick(template)}
        style={{
          background: 'transparent',
          border: 'none',
          color: palette.text,
          cursor: 'pointer',
          fontSize: '13px',
          padding: '4px',
          textAlign: 'left',
        }}
      >
        {pageLabel(template)}
      </button>
    ))}
    <div>
      <ActionButton label="Annuler" onClick={onCancel} palette={palette} />
    </div>
  </div>
);
