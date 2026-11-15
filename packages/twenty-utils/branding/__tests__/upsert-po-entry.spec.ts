import { readPoEntries, upsertPoEntry } from '../upsert-po-entry';

const HEADER = 'msgid ""\nmsgstr ""\n"Language: fr\\n"\n';

const CATALOG = [
  HEADER,
  '#. js-lingui-id: aaaaaa\n#: src/A.tsx\nmsgid "First"\nmsgstr "Premier"\n',
  '#. js-lingui-id: bbbbbb\n#: src/B.tsx\nmsgid "Second"\nmsgstr "Deuxième"\n',
  '#. js-lingui-id: cccccc\n#: src/C.tsx\nmsgid ""\n"Third line one\\n"\n"line two"\nmsgstr "Troisième"\n',
].join('\n');

describe('upsertPoEntry', () => {
  it('adds a generated-id entry at the end of the catalog', () => {
    const result = upsertPoEntry(CATALOG, {
      id: 'nTuObL',
      message: 'Welcome to {brandName}',
      translation: 'Bienvenue sur {brandName}',
      reference: 'src/pages/auth/SignInUp.tsx',
    });

    expect(result).toBe(
      `${CATALOG}\n#. js-lingui-id: nTuObL\n#: src/pages/auth/SignInUp.tsx\nmsgid "Welcome to {brandName}"\nmsgstr "Bienvenue sur {brandName}"\n`,
    );
  });

  it('adds an explicit-id entry for emails', () => {
    const result = upsertPoEntry(CATALOG, {
      id: null,
      message: 'What is {brandName}?',
      translation: 'Qu’est-ce que {brandName} ?',
      reference: 'src/components/WhatIsTwenty.tsx',
    });

    expect(
      result.endsWith(
        '\n#. js-lingui-explicit-id\n#: src/components/WhatIsTwenty.tsx\nmsgid "What is {brandName}?"\nmsgstr "Qu’est-ce que {brandName} ?"\n',
      ),
    ).toBe(true);
  });

  it('replaces the translation of an existing message and leaves the rest untouched', () => {
    const result = upsertPoEntry(CATALOG, {
      id: 'bbbbbb',
      message: 'Second',
      translation: 'Second, révisé',
      reference: 'src/B.tsx',
    });

    expect(result).toBe(
      CATALOG.replace('msgstr "Deuxième"', 'msgstr "Second, révisé"'),
    );
  });

  it('finds a message written over several lines', () => {
    const result = upsertPoEntry(CATALOG, {
      id: 'cccccc',
      message: 'Third line one\nline two',
      translation: 'Troisième, révisé',
      reference: 'src/C.tsx',
    });

    expect(result).toBe(
      CATALOG.replace('msgstr "Troisième"', 'msgstr "Troisième, révisé"'),
    );
  });

  it('escapes quotes, backslashes and line breaks', () => {
    const result = upsertPoEntry(CATALOG, {
      id: 'dddddd',
      message: 'Run "npx" in C:\\app\nthen wait',
      translation: 'Lancez "npx" dans C:\\app\npuis attendez',
      reference: 'src/D.tsx',
    });

    expect(result).toContain(
      'msgid "Run \\"npx\\" in C:\\\\app\\nthen wait"\nmsgstr "Lancez \\"npx\\" dans C:\\\\app\\npuis attendez"\n',
    );
    expect(
      upsertPoEntry(result, {
        id: 'dddddd',
        message: 'Run "npx" in C:\\app\nthen wait',
        translation: 'x',
        reference: 'src/D.tsx',
      }),
    ).toContain('msgstr "x"');
  });
});

describe('readPoEntries', () => {
  it('reads id, message, translation and reference of every entry but the header', () => {
    expect(readPoEntries(CATALOG)).toEqual([
      {
        id: 'aaaaaa',
        message: 'First',
        translation: 'Premier',
        reference: 'src/A.tsx',
      },
      {
        id: 'bbbbbb',
        message: 'Second',
        translation: 'Deuxième',
        reference: 'src/B.tsx',
      },
      {
        id: 'cccccc',
        message: 'Third line one\nline two',
        translation: 'Troisième',
        reference: 'src/C.tsx',
      },
    ]);
  });
});
