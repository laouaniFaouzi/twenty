import { mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import sharp from 'sharp';

import { buildIconSvg, buildSignInMarkSvg } from './brand-assets';

const FRONT_PUBLIC_DIRECTORY = join(
  __dirname,
  '..',
  '..',
  'twenty-front',
  'public',
);
const ICONS_DIRECTORY = join(FRONT_PUBLIC_DIRECTORY, 'images', 'icons');
const EMAIL_LOGO_FILE = join(
  FRONT_PUBLIC_DIRECTORY,
  'images',
  'hubfaze',
  'email-logo.png',
);
const WORDMARK_FILE = join(__dirname, 'assets', 'hubfaze-wordmark.svg');
// Kept under Twenty's file name so the components that load it stay untouched.
const SIGN_IN_MARK_FILE = join(
  FRONT_PUBLIC_DIRECTORY,
  'images',
  'integrations',
  'twenty-logo.svg',
);

// Shown at 40 px in the emails, drawn at twice that for sharp screens.
const EMAIL_LOGO_HEIGHT = 80;

const listPngFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return listPngFiles(path);
    }

    return path.endsWith('.png') ? [path] : [];
  });

// Each icon keeps the size Twenty shipped it at, so the manifest and the
// html links stay valid without edits.
const regenerateIcon = async (file: string) => {
  const { width, height } = await sharp(file).metadata();

  if (width === undefined || height === undefined) {
    throw new Error(`Cannot read the size of ${file}`);
  }

  await sharp(Buffer.from(buildIconSvg(width, height)))
    .png()
    .toFile(file);
};

const main = async () => {
  const icons = listPngFiles(ICONS_DIRECTORY);

  for (const icon of icons) {
    await regenerateIcon(icon);
  }

  mkdirSync(dirname(EMAIL_LOGO_FILE), { recursive: true });
  await sharp(WORDMARK_FILE, { density: 300 })
    .resize({ height: EMAIL_LOGO_HEIGHT })
    .png()
    .toFile(EMAIL_LOGO_FILE);

  writeFileSync(SIGN_IN_MARK_FILE, buildSignInMarkSvg());

  console.log(
    `${icons.length} icons regenerated, email logo and sign-in mark written`,
  );
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
