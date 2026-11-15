import ts from 'typescript';

export type BrandViolation = { file: string; line: number; text: string };

export type BrandCheckException = {
  path: string;
  text?: string;
  reason: string;
};

// Case-sensitive on purpose: lowercase addresses (twenty.com) and package
// names (twenty-shared) are not shown to the team as the product name.
const BRAND_WORD = /\bTwenty\b/;

const lineAt = (source: string, position: number) =>
  source.slice(0, position).split('\n').length;

export const findSourceViolations = (
  file: string,
  source: string,
): BrandViolation[] => {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const violations: BrandViolation[] = [];

  const report = (node: ts.Node, text: string) => {
    const index = text.search(BRAND_WORD);

    if (index === -1) {
      return;
    }

    // Raw JSX text keeps its leading line breaks, so the word's own offset
    // gives its line.
    const offset = ts.isJsxText(node) ? index : 0;

    violations.push({
      file,
      line: lineAt(source, node.getStart(sourceFile) + offset),
      text: text.trim(),
    });
  };

  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isJsxText(node)
    ) {
      report(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      report(node.head, node.head.text);

      for (const span of node.templateSpans) {
        report(span.literal, span.literal.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return violations;
};

const blankOut = (source: string, pattern: RegExp) =>
  source.replace(pattern, (match) => match.replace(/[^\n]/g, ' '));

const collectJsonStrings = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectJsonStrings);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectJsonStrings);
  }

  return [];
};

export const findMarkupViolations = (
  file: string,
  source: string,
): BrandViolation[] => {
  if (file.endsWith('.json')) {
    return collectJsonStrings(JSON.parse(source))
      .filter((text) => BRAND_WORD.test(text))
      .map((text) => ({
        file,
        line: lineAt(source, Math.max(0, source.indexOf(JSON.stringify(text)))),
        text,
      }));
  }

  const visible = blankOut(
    blankOut(source, /<!--[\s\S]*?-->/g),
    /<script\b[\s\S]*?<\/script>/g,
  );

  return visible
    .split('\n')
    .flatMap((lineText, index) =>
      BRAND_WORD.test(lineText)
        ? [{ file, line: index + 1, text: lineText.trim() }]
        : [],
    );
};

export const isExcepted = (
  violation: BrandViolation,
  exceptions: BrandCheckException[],
): boolean =>
  exceptions.some(
    ({ path, text }) =>
      (path.endsWith('/')
        ? violation.file.startsWith(path)
        : violation.file === path) &&
      (text === undefined || violation.text === text),
  );
