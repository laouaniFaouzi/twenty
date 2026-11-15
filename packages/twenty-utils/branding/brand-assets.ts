import { readFileSync } from 'fs';
import { join } from 'path';

export const BRAND_COLORS = {
  asterisk: '#FF4D23',
  background: '#08131D',
} as const;

const ICON_MARK_RATIO = 0.64;

type AsteriskDrawing = {
  viewBox: [number, number, number, number];
  paths: string[];
};

const readAsterisk = (): AsteriskDrawing => {
  const svg = readFileSync(join(__dirname, 'assets', 'asterisk.svg'), 'utf8');
  const viewBox = svg
    .match(/viewBox="([^"]+)"/)?.[1]
    .split(/\s+/)
    .map(Number);

  if (viewBox?.length !== 4) {
    throw new Error('assets/asterisk.svg has no usable viewBox');
  }

  return {
    viewBox: viewBox as AsteriskDrawing['viewBox'],
    paths: [...svg.matchAll(/\bd="([^"]+)"/g)].map(([, path]) => path),
  };
};

export const buildIconSvg = (
  width: number,
  height: number = width,
  cornerRadius = 0,
): string => {
  const {
    viewBox: [x, y, drawingWidth, drawingHeight],
    paths,
  } = readAsterisk();
  const scale =
    (Math.min(width, height) * ICON_MARK_RATIO) /
    Math.max(drawingWidth, drawingHeight);
  const offsetX = (width - drawingWidth * scale) / 2 - x * scale;
  const offsetY = (height - drawingHeight * scale) / 2 - y * scale;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}"${cornerRadius > 0 ? ` rx="${cornerRadius}"` : ''} fill="${BRAND_COLORS.background}"/>`,
    `<g transform="translate(${offsetX} ${offsetY}) scale(${scale})" fill="${BRAND_COLORS.asterisk}">`,
    ...paths.map((path) => `<path d="${path}"/>`),
    '</g>',
    '</svg>',
  ].join('');
};

// Same size and corners as the Twenty mark that the sign-in loader and the
// onboarding headers load by file name.
export const buildSignInMarkSvg = (): string => buildIconSvg(96, 96, 11.3);
