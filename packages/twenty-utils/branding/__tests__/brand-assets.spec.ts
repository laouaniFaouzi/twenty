import { readFileSync } from 'fs';
import { join } from 'path';

import {
  BRAND_COLORS,
  buildIconSvg,
  buildSignInMarkSvg,
} from '../brand-assets';

// The asterisk drawing is 183.61 units wide, its larger side.
const ASTERISK_WIDTH = 183.61;

describe('buildIconSvg', () => {
  const svg = buildIconSvg(192);

  it('draws a square of the requested size', () => {
    expect(svg).toContain('width="192"');
    expect(svg).toContain('height="192"');
  });

  it('fills the background in navy and the asterisk in orange', () => {
    expect(BRAND_COLORS).toEqual({
      asterisk: '#FF4D23',
      background: '#08131D',
    });
    expect(svg).toMatch(/<rect[^>]*fill="#08131D"/);
    expect(svg).toMatch(/<g[^>]*fill="#FF4D23"/);
    expect(svg).toContain('<path d="M 180.734375 80.246094');
  });

  it('scales the asterisk to 64 % of the side', () => {
    const scale = Number(svg.match(/scale\(([0-9.]+)\)/)?.[1]);

    expect(scale).toBeCloseTo((192 * 0.64) / ASTERISK_WIDTH, 6);
  });

  it('leaves the provenance metadata of the source file out', () => {
    expect(svg).not.toContain('c2pa');
    expect(svg).not.toContain('metadata');
  });

  it('centres the asterisk on wide tiles, sized from their shorter side', () => {
    const wideSvg = buildIconSvg(310, 150);
    const scale = Number(wideSvg.match(/scale\(([0-9.]+)\)/)?.[1]);

    expect(wideSvg).toContain('width="310"');
    expect(wideSvg).toContain('height="150"');
    expect(scale).toBeCloseTo((150 * 0.64) / ASTERISK_WIDTH, 6);
  });

  it('rounds the corners when asked', () => {
    expect(buildIconSvg(96, 96, 11.3)).toMatch(/<rect[^>]*rx="11.3"/);
  });
});

describe('the mark shown during sign-in and onboarding', () => {
  // The onboarding loader and headers load this file by name.
  const TWENTY_MARK_FILE = join(
    __dirname,
    '..',
    '..',
    '..',
    'twenty-front',
    'public',
    'images',
    'integrations',
    'twenty-logo.svg',
  );

  it('is the HubFaze asterisk, rounded like the mark it replaces', () => {
    expect(buildSignInMarkSvg()).toBe(buildIconSvg(96, 96, 11.3));
    expect(readFileSync(TWENTY_MARK_FILE, 'utf8')).toBe(buildSignInMarkSvg());
  });
});
