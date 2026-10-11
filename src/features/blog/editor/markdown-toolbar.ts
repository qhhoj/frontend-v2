/** The editor toolbar's Markdown actions: wrap the selection, or prefix each selected line. */
export type MarkdownAction = 'bold' | 'italic' | 'code' | 'link' | 'bullet' | 'numbered' | 'math';

/** A textarea's text and selection. */
export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

const WRAPS: Partial<Record<MarkdownAction, [string, string]>> = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  code: ['`', '`'],
  math: ['$', '$'],
  link: ['[', '](https://)'],
};
const LINE_PREFIXES: Partial<Record<MarkdownAction, string>> = { bullet: '- ', numbered: '1. ' };

function wrap({ text, start, end }: TextSelection, [before, after]: [string, string]) {
  return {
    text: text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end),
    start: start + before.length,
    end: end + before.length,
  };
}

/** Every line the selection touches; a selection ending right after a line break leaves the next line alone. */
function prefixLines({ text, start, end }: TextSelection, prefix: string) {
  const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  const lastEnd = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const lines = text.slice(lineStart, lastEnd).split('\n');
  const prefixed = lines.map((line) => prefix + line).join('\n');
  return {
    text: text.slice(0, lineStart) + prefixed + text.slice(lastEnd),
    start: start + prefix.length,
    end: lastEnd + prefix.length * lines.length,
  };
}

/** The text after `action`, with the selection kept on what was selected. */
export function applyMarkdown(selection: TextSelection, action: MarkdownAction): TextSelection {
  const pair = WRAPS[action];
  return pair ? wrap(selection, pair) : prefixLines(selection, LINE_PREFIXES[action] ?? '');
}
