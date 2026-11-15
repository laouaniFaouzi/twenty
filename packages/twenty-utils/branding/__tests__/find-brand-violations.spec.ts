import {
  findMarkupViolations,
  findSourceViolations,
  isExcepted,
} from '../find-brand-violations';

const FILE = 'packages/twenty-front/src/Example.tsx';

const linesAndTexts = (violations: { line: number; text: string }[]) =>
  violations.map(({ line, text }) => [line, text]);

describe('findSourceViolations', () => {
  it('flags Twenty in a t template, a Trans child, a JSX attribute and a string literal', () => {
    const source = [
      'const title = t`Welcome to Twenty`;',
      'const Note = () => <Trans>By using Twenty</Trans>;',
      'const Logo = () => <img alt="Twenty logo" />;',
      "const name = 'Twenty';",
    ].join('\n');

    expect(linesAndTexts(findSourceViolations(FILE, source))).toEqual([
      [1, 'Welcome to Twenty'],
      [2, 'By using Twenty'],
      [3, 'Twenty logo'],
      [4, 'Twenty'],
    ]);
  });

  it('flags the static parts of a template with variables', () => {
    const source = 'const subject = `Join ${team} on Twenty`;';

    expect(linesAndTexts(findSourceViolations(FILE, source))).toEqual([
      [1, 'on Twenty'],
    ]);
  });

  it('reports the line of the word inside multi-line text', () => {
    const source = [
      'const Page = () => (',
      '  <p>',
      '    Hello',
      '    from Twenty',
      '  </p>',
      ');',
    ].join('\n');

    expect(findSourceViolations(FILE, source).map(({ line }) => line)).toEqual([
      4,
    ]);
  });

  it('ignores comments, imports and lowercase addresses', () => {
    const source = [
      '// Twenty applies reorders here',
      "import { BRAND } from 'twenty-shared/constants';",
      "const url = 'https://twenty.com/legal';",
      '/* Twenty */',
    ].join('\n');

    expect(findSourceViolations(FILE, source)).toEqual([]);
  });

  it('ignores identifiers that only contain the word', () => {
    const source = [
      'const TwentyORM = 1;',
      "const twentyConfig = 'twentyConfig';",
      "const label = 'TwentyStandardApp';",
    ].join('\n');

    expect(findSourceViolations(FILE, source)).toEqual([]);
  });
});

describe('findMarkupViolations', () => {
  it('reads the title of an html page but not its comments or scripts', () => {
    const source = [
      '<!-- BEGIN: Twenty Config -->',
      "<script>window.name = 'Twenty';</script>",
      '<title>Twenty</title>',
    ].join('\n');

    expect(
      linesAndTexts(
        findMarkupViolations('packages/twenty-front/index.html', source),
      ),
    ).toEqual([[3, '<title>Twenty</title>']]);
  });

  it('reads the string values of a json manifest', () => {
    const source = [
      '{',
      '  "short_name": "Twenty",',
      '  "icons": [{ "src": "images/twenty.png" }]',
      '}',
    ].join('\n');

    expect(
      linesAndTexts(
        findMarkupViolations(
          'packages/twenty-front/public/manifest.json',
          source,
        ),
      ),
    ).toEqual([[2, 'Twenty']]);
  });
});

describe('isExcepted', () => {
  const violation = {
    file: 'packages/twenty-front/src/modules/settings/billing/Plan.tsx',
    line: 3,
    text: 'Contact Twenty team',
  };

  it('excepts a whole folder, a file, or one text of a file', () => {
    expect(
      isExcepted(violation, [
        {
          path: 'packages/twenty-front/src/modules/settings/billing/',
          reason: 'Cloud only',
        },
      ]),
    ).toBe(true);
    expect(
      isExcepted(violation, [{ path: violation.file, reason: 'Cloud only' }]),
    ).toBe(true);
    expect(
      isExcepted(violation, [
        {
          path: violation.file,
          text: 'Contact Twenty team',
          reason: 'Cloud only',
        },
      ]),
    ).toBe(true);
  });

  it('does not except another text of the same file, nor a sibling folder', () => {
    expect(
      isExcepted(violation, [
        { path: violation.file, text: 'Another Twenty text', reason: 'x' },
      ]),
    ).toBe(false);
    expect(
      isExcepted(violation, [
        {
          path: 'packages/twenty-front/src/modules/settings/bill',
          reason: 'x',
        },
      ]),
    ).toBe(false);
  });
});
