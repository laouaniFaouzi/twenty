export type PoEntry = {
  // null for the explicit ids of the emails, whose id is the message itself.
  id: string | null;
  message: string;
  translation: string;
  reference: string;
};

const BLOCK_SEPARATOR = '\n\n';

const escapePoText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');

const unescapePoText = (text: string) =>
  text.replace(/\\(.)/g, (_, character: string) =>
    character === 'n' ? '\n' : character === 't' ? '\t' : character,
  );

const quotedText = (line: string) =>
  unescapePoText(line.slice(line.indexOf('"') + 1, line.lastIndexOf('"')));

// A field spans its keyword line and the quoted lines that follow it.
const fieldLineRange = (lines: string[], keyword: 'msgid' | 'msgstr') => {
  const start = lines.findIndex((line) => line.startsWith(`${keyword} "`));

  if (start === -1) {
    return null;
  }

  let end = start + 1;

  while (end < lines.length && lines[end].startsWith('"')) {
    end += 1;
  }

  return { start, end };
};

const messageOf = (block: string): string | null => {
  const lines = block.split('\n');
  const range = fieldLineRange(lines, 'msgid');

  return range === null
    ? null
    : lines.slice(range.start, range.end).map(quotedText).join('');
};

const withTranslation = (block: string, translation: string) => {
  const lines = block.split('\n');
  const range = fieldLineRange(lines, 'msgstr');

  if (range === null) {
    return block;
  }

  lines.splice(
    range.start,
    range.end - range.start,
    `msgstr "${escapePoText(translation)}"`,
  );

  return lines.join('\n');
};

export const upsertPoEntry = (po: string, entry: PoEntry): string => {
  const blocks = po.split(BLOCK_SEPARATOR);
  const index = blocks.findIndex((block) => messageOf(block) === entry.message);

  if (index !== -1) {
    blocks[index] = withTranslation(blocks[index], entry.translation);

    return blocks.join(BLOCK_SEPARATOR);
  }

  const block = [
    entry.id === null
      ? '#. js-lingui-explicit-id'
      : `#. js-lingui-id: ${entry.id}`,
    `#: ${entry.reference}`,
    `msgid "${escapePoText(entry.message)}"`,
    `msgstr "${escapePoText(entry.translation)}"`,
  ].join('\n');

  return `${po.endsWith('\n') ? po : `${po}\n`}\n${block}\n`;
};

export type ExtractedPoEntry = {
  id: string | null;
  message: string;
  translation: string;
  reference: string;
};

export const readPoEntries = (po: string): ExtractedPoEntry[] =>
  po.split(BLOCK_SEPARATOR).flatMap((block) => {
    const message = messageOf(block);

    if (message === null || message === '') {
      return [];
    }

    const lines = block.split('\n');
    const translationRange = fieldLineRange(lines, 'msgstr');
    const generatedId = lines
      .find((line) => line.startsWith('#. js-lingui-id: '))
      ?.slice('#. js-lingui-id: '.length);

    return [
      {
        id: generatedId ?? null,
        message,
        translation:
          translationRange === null
            ? ''
            : lines
                .slice(translationRange.start, translationRange.end)
                .map(quotedText)
                .join(''),
        reference:
          lines.find((line) => line.startsWith('#: '))?.slice('#: '.length) ??
          '',
      },
    ];
  });
