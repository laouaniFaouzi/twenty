import { generateMessageId } from '@lingui/message-utils/generateMessageId';

import {
  BRAND_TRANSLATIONS,
  type BrandCatalogPackage,
} from './brand-translations';

export type CompiledCatalog = {
  packageName: BrandCatalogPackage;
  locale: string;
  messages: Record<string, unknown>;
};

const FRENCH_LOCALE = 'fr-FR';

// The emails use explicit ids, which are the English message itself.
export const brandCatalogKey = (
  packageName: BrandCatalogPackage,
  message: string,
): string =>
  packageName === 'twenty-emails' ? message : generateMessageId(message);

// Compiled messages are text parts and [placeholder] arrays.
const readCompiledMessage = (compiled: unknown): string =>
  Array.isArray(compiled)
    ? compiled
        .map((part) => (Array.isArray(part) ? `{${part[0]}}` : String(part)))
        .join('')
    : String(compiled);

// A production build keeps only ids, so a brand key missing from a compiled
// catalog shows up as a raw key such as "gki87D" on screen.
export const findBrandCatalogGaps = (
  translations: typeof BRAND_TRANSLATIONS,
  catalogs: CompiledCatalog[],
): string[] =>
  catalogs.flatMap(({ packageName, locale, messages }) =>
    Object.entries(translations[packageName]).flatMap(([message, french]) => {
      const key = brandCatalogKey(packageName, message);

      if (!(key in messages)) {
        return [
          `${packageName} ${locale}: no ${JSON.stringify(message)} (${key}), users would see the raw key`,
        ];
      }

      const text = readCompiledMessage(messages[key]);

      return locale === FRENCH_LOCALE && text !== french
        ? [
            `${packageName} ${locale}: ${JSON.stringify(message)} reads ${JSON.stringify(text)} instead of ${JSON.stringify(french)}`,
          ]
        : [];
    }),
  );
