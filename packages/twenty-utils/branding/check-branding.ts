import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

import { BRAND_CHECK_EXCEPTIONS } from './brand-check-exceptions';
import {
  BRAND_TRANSLATIONS,
  type BrandCatalogPackage,
} from './brand-translations';
import {
  type CompiledCatalog,
  findBrandCatalogGaps,
} from './find-brand-catalog-gaps';
import {
  type BrandViolation,
  findMarkupViolations,
  findSourceViolations,
  isExcepted,
} from './find-brand-violations';

const REPOSITORY_ROOT = join(__dirname, '..', '..', '..');

const SKIPPED_DIRECTORIES = new Set([
  '__tests__',
  '__stories__',
  '__mocks__',
  'testing',
  'locales',
  'generated',
  'node_modules',
  'dist',
]);

const SKIPPED_FILE = /\.(test|spec|stories)\.tsx?$/;

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry) ? [] : listSourceFiles(path);
    }

    return /\.tsx?$/.test(entry) && !SKIPPED_FILE.test(entry) ? [path] : [];
  });

const fromRoot = (...segments: string[]) => join(REPOSITORY_ROOT, ...segments);

const read = (path: string) => readFileSync(path, 'utf8');

// The server's visible text is its email subjects and bodies: the files
// that send emails import the email templates.
const sendsEmails = (path: string) =>
  read(path).includes("from 'twenty-emails'");

const collectViolations = (): BrandViolation[] => {
  const sourceFiles = [
    ...listSourceFiles(fromRoot('packages', 'twenty-front', 'src')),
    ...listSourceFiles(fromRoot('packages', 'twenty-emails', 'src')),
    ...listSourceFiles(fromRoot('packages', 'twenty-server', 'src')).filter(
      sendsEmails,
    ),
  ];
  const markupFiles = [
    fromRoot('packages', 'twenty-front', 'index.html'),
    fromRoot('packages', 'twenty-front', 'public', 'manifest.json'),
  ];

  return [
    ...sourceFiles.flatMap((path) =>
      findSourceViolations(relative(REPOSITORY_ROOT, path), read(path)),
    ),
    ...markupFiles.flatMap((path) =>
      findMarkupViolations(relative(REPOSITORY_ROOT, path), read(path)),
    ),
  ];
};

const COMPILED_CATALOG_DIRECTORIES: Record<BrandCatalogPackage, string> = {
  'twenty-front': 'packages/twenty-front/src/locales/generated',
  'twenty-emails': 'packages/twenty-emails/src/locales/generated',
  'twenty-server':
    'packages/twenty-server/src/engine/core-modules/i18n/locales/generated',
};

const loadCompiledCatalogs = (): CompiledCatalog[] =>
  Object.entries(COMPILED_CATALOG_DIRECTORIES).flatMap(
    ([packageName, directory]) =>
      readdirSync(fromRoot(directory))
        .filter((file) => file.endsWith('.ts'))
        .map((file) => ({
          packageName: packageName as BrandCatalogPackage,
          locale: file.replace(/\.ts$/, ''),
          // tsx runs this script, so the compiled catalogs load as modules.
          messages: (
            require(fromRoot(directory, file)) as {
              messages: Record<string, unknown>;
            }
          ).messages,
        })),
  );

const catalogGaps = findBrandCatalogGaps(
  BRAND_TRANSLATIONS,
  loadCompiledCatalogs(),
);

for (const gap of catalogGaps) {
  console.log(gap);
}

if (catalogGaps.length > 0) {
  console.log(
    `\n${catalogGaps.length} brand translations missing from the compiled catalogs. Run npx nx run twenty-utils:brand-translations (see BRANDING.md).`,
  );
  process.exit(1);
}

const violations = collectViolations().filter(
  (violation) => !isExcepted(violation, BRAND_CHECK_EXCEPTIONS),
);

for (const { file, line, text } of violations) {
  console.log(`${file}:${line}: ${JSON.stringify(text)}`);
}

if (violations.length > 0) {
  console.log(
    `\n${violations.length} "Twenty" shown to the team. Use BRAND from twenty-shared, or add an exception with its reason (see BRANDING.md).`,
  );
  process.exit(1);
}

console.log(
  'No "Twenty" shown to the team, and every brand translation is compiled.',
);
