// A table header is sentence case, muted, 13 px: the DataTable recipe `text-meta font-semibold text-muted` (docs/design-language.md, Rules).
// So no `uppercase` on a `<th>`, `<thead>` or `<tr>` class, nor in a header recipe (a constant named *HEAD* or *HEADER*, e.g. `ENDED_HEAD_ROW_CLASS`).
// Section labels outside a table may stay uppercase: this reads table headers only.
import { classTokens } from './class-tokens.mjs';

/** An opening header tag, over lines; a `>` inside a quoted attribute value does not end it. */
const HEADER_TAG = /<(?:th|thead|tr)\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
/** `const HEAD = '...'`, `export const ENDED_HEAD_ROW_CLASS =\n  '...'`: an upper-case constant with the word HEAD or HEADER in its name. */
const HEADER_RECIPE =
  /\b(?:[A-Z][A-Z0-9]*_)*(?:HEAD|HEADER)(?:_[A-Z][A-Z0-9]*)*\s*(?::[^=\n]+)?=\s*(['"`])((?:(?!\1)[^\n])*)\1/g;

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The `uppercase` classes of header tags and header recipes in one file, as `{ line, text }`. */
export function tableHeaderUppercase(source) {
  const found = [];
  for (const [text, index] of [
    ...[...source.matchAll(HEADER_TAG)].map((match) => [match[0], match.index]),
    ...[...source.matchAll(HEADER_RECIPE)].map((match) => [match[0], match.index]),
  ])
    for (const token of classTokens(text))
      if (token.replace(/^.*:/, '') === 'uppercase')
        found.push({ line: lineOf(source, index + text.indexOf(token)), text: token });
  return found.sort((first, second) => first.line - second.line);
}
