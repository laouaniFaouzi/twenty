import { execSync } from 'child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';

import {
  BRAND_TRANSLATIONS,
  type BrandCatalogPackage,
} from './brand-translations';
import {
  type ExtractedPoEntry,
  readPoEntries,
  upsertPoEntry,
} from './upsert-po-entry';

type BrandCatalog = {
  name: BrandCatalogPackage;
  localesDirectory: string;
  explicitIds: boolean;
};

const REPOSITORY_ROOT = join(__dirname, '..', '..', '..');

const BRAND_CATALOGS: BrandCatalog[] = [
  {
    name: 'twenty-front',
    localesDirectory: 'src/locales',
    explicitIds: false,
  },
  {
    name: 'twenty-emails',
    localesDirectory: 'src/locales',
    explicitIds: true,
  },
  {
    name: 'twenty-server',
    localesDirectory: 'src/engine/core-modules/i18n/locales',
    explicitIds: false,
  },
];

const BRAND_PLACEHOLDER = '{brandName}';
const SKIPPED_DIRECTORIES = new Set([
  '__tests__',
  'locales',
  'generated',
  'node_modules',
]);

const listBrandFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry) ? [] : listBrandFiles(path);
    }

    if (!/\.tsx?$/.test(entry) || /\.(test|spec|stories)\.tsx?$/.test(entry)) {
      return [];
    }

    const source = readFileSync(path, 'utf8');

    return source.includes("from 'twenty-shared/constants'") &&
      /\bBRAND\b/.test(source)
      ? [path]
      : [];
  });

// The real catalogs lag behind the sources (the i18n pipeline extracts them),
// so a full extract would rewrite thousands of unrelated lines. Only the
// files that use the brand are extracted, into a scratch catalog.
const extractBrandFiles = (packageDirectory: string): ExtractedPoEntry[] => {
  const files = listBrandFiles(join(packageDirectory, 'src')).map((file) =>
    relative(packageDirectory, file),
  );
  const outputDirectory = mkdtempSync(join(tmpdir(), 'brand-translations-'));
  const configFile = join(
    packageDirectory,
    'lingui.brand-translations.config.ts',
  );

  writeFileSync(
    configFile,
    [
      "import baseConfig from './lingui.config';",
      '',
      'export default {',
      '  ...baseConfig,',
      "  locales: ['en'],",
      '  pseudoLocale: undefined,',
      '  fallbackLocales: undefined,',
      '  catalogsMergePath: undefined,',
      `  catalogs: [{ path: ${JSON.stringify(join(outputDirectory, '{locale}'))}, include: ${JSON.stringify(files)} }],`,
      '};',
      '',
    ].join('\n'),
  );

  try {
    execSync(`npx lingui extract --config ${configFile}`, {
      cwd: packageDirectory,
      stdio: 'pipe',
    });

    return readPoEntries(readFileSync(join(outputDirectory, 'en.po'), 'utf8'));
  } finally {
    rmSync(configFile, { force: true });
    rmSync(outputDirectory, { recursive: true, force: true });
  }
};

const suggestFrench = (message: string, frenchEntries: ExtractedPoEntry[]) =>
  frenchEntries
    .find(
      (entry) =>
        entry.message === message.split(BRAND_PLACEHOLDER).join('Twenty'),
    )
    ?.translation.split('Twenty')
    .join(BRAND_PLACEHOLDER);

const applyCatalog = ({
  name,
  localesDirectory,
  explicitIds,
}: BrandCatalog) => {
  const packageDirectory = join(REPOSITORY_ROOT, 'packages', name);
  const translations = BRAND_TRANSLATIONS[name];
  const englishFile = join(packageDirectory, localesDirectory, 'en.po');
  const frenchFile = join(packageDirectory, localesDirectory, 'fr-FR.po');
  const frenchEntries = readPoEntries(readFileSync(frenchFile, 'utf8'));

  const brandEntries = extractBrandFiles(packageDirectory).filter(
    ({ message }) =>
      message.includes(BRAND_PLACEHOLDER) || message in translations,
  );
  const missing = brandEntries.filter(
    ({ message }) => !(message in translations),
  );
  const stale = Object.keys(translations).filter(
    (message) => !brandEntries.some((entry) => entry.message === message),
  );

  for (const { message } of missing) {
    console.log(
      `${name}: no French for ${JSON.stringify(message)}` +
        `\n  suggestion: ${JSON.stringify(suggestFrench(message, frenchEntries) ?? null)}`,
    );
  }

  for (const message of stale) {
    console.log(
      `${name}: no source produces ${JSON.stringify(message)} any more`,
    );
  }

  if (missing.length > 0 || stale.length > 0) {
    return false;
  }

  let english = readFileSync(englishFile, 'utf8');
  let french = readFileSync(frenchFile, 'utf8');

  for (const { id, message, reference } of brandEntries) {
    const entryId = explicitIds ? null : id;

    english = upsertPoEntry(english, {
      id: entryId,
      message,
      translation: message,
      reference,
    });
    french = upsertPoEntry(french, {
      id: entryId,
      message,
      translation: translations[message],
      reference,
    });
  }

  writeFileSync(englishFile, english);
  writeFileSync(frenchFile, french);

  execSync('npx lingui compile --typescript', {
    cwd: packageDirectory,
    stdio: 'inherit',
  });
  console.log(`${name}: ${brandEntries.length} brand messages in en and fr-FR`);

  return true;
};

const succeeded = BRAND_CATALOGS.map(applyCatalog).every(Boolean);

if (!succeeded) {
  console.log(
    '\nAdd the missing French to branding/brand-translations.ts, or remove the stale entries, then run again.',
  );
  process.exit(1);
}
