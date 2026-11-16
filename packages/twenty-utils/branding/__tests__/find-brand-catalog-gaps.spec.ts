import {
  brandCatalogKey,
  findBrandCatalogGaps,
} from '../find-brand-catalog-gaps';

const TRANSLATIONS = {
  'twenty-front': { 'Welcome to {brandName}': 'Bienvenue sur {brandName}' },
  'twenty-emails': {},
  'twenty-server': {},
};

const KEY = 'gki87D';

const catalog = (locale: string, messages: Record<string, unknown>) => ({
  packageName: 'twenty-front' as const,
  locale,
  messages,
});

describe('brandCatalogKey', () => {
  it('keys front and server messages by their generated id, emails by the message', () => {
    expect(brandCatalogKey('twenty-front', 'Welcome to {brandName}')).toBe(KEY);
    expect(brandCatalogKey('twenty-server', 'Welcome to {brandName}')).toBe(
      KEY,
    );
    expect(brandCatalogKey('twenty-emails', 'What is {brandName}?')).toBe(
      'What is {brandName}?',
    );
  });
});

describe('findBrandCatalogGaps', () => {
  it('finds nothing when every locale has the key and fr-FR has the French', () => {
    expect(
      findBrandCatalogGaps(TRANSLATIONS, [
        catalog('fr-FR', { [KEY]: ['Bienvenue sur ', ['brandName']] }),
        catalog('de-DE', { [KEY]: ['Welcome to ', ['brandName']] }),
      ]),
    ).toEqual([]);
  });

  it('flags a locale that lost a brand key', () => {
    expect(
      findBrandCatalogGaps(TRANSLATIONS, [
        catalog('fr-FR', { [KEY]: ['Bienvenue sur ', ['brandName']] }),
        catalog('de-DE', {}),
      ]),
    ).toEqual([
      'twenty-front de-DE: no "Welcome to {brandName}" (gki87D), users would see the raw key',
    ]);
  });

  it('flags fr-FR when it falls back to English', () => {
    expect(
      findBrandCatalogGaps(TRANSLATIONS, [
        catalog('fr-FR', { [KEY]: ['Welcome to ', ['brandName']] }),
      ]),
    ).toEqual([
      'twenty-front fr-FR: "Welcome to {brandName}" reads "Welcome to {brandName}" instead of "Bienvenue sur {brandName}"',
    ]);
  });
});
