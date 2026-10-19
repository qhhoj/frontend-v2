// A form control's border must reach 3:1 against its ground (WCAG 1.4.11, docs/design-language.md, Control border): `border-line-control`.
// The hairline tokens `border-line` and `border-line-strong` are 1.3-1.8:1 and belong to cards, dividers and menus, never to a field.
// A control is an `<input>`, `<select>` or `<textarea>`, or a string that styles one: a placeholder, a wrapper that shows focus-within
// or a focused or checked child (`placeholder:`, `focus-within:`, `has-[:focus-visible]:`, `has-[:checked]:`).
import { classLiterals, classTokens } from './class-tokens.mjs';

/** An opening control tag, over lines; a `>` inside a quoted attribute value does not end it. */
const CONTROL_TAG = /<(?:input|select|textarea)\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const FIELD_VARIANT = /^(?:placeholder|focus-within|has-\[:(?:focus-visible|checked)\]):/;
const HAIRLINE = /^border-line(?:-strong)?$/;

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The hairline border classes on the controls of one file, as `{ line, text }`. */
export function hairlineControlBorders(source) {
  const found = new Map();
  const add = (line, token) => found.set(`${line}:${token}`, { line, text: token });
  for (const match of source.matchAll(CONTROL_TAG)) {
    const first = lineOf(source, match.index);
    match[0].split('\n').forEach((text, offset) => {
      for (const token of classTokens(text)) if (HAIRLINE.test(token)) add(first + offset, token);
    });
  }
  source.split('\n').forEach((text, index) => {
    for (const literal of classLiterals(text))
      if (literal.some((token) => FIELD_VARIANT.test(token)))
        for (const token of literal) if (HAIRLINE.test(token)) add(index + 1, token);
  });
  return [...found.values()].sort((first, second) => first.line - second.line);
}
