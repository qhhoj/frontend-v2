// A form control's border must reach 3:1 against its ground (WCAG 1.4.11, docs/design-language.md, Control border): `border-line-control`.
// The hairline tokens `border-line` and `border-line-strong` are 1.3-1.8:1 and belong to cards, dividers and menus, never to a field.
// A control is an `<input>`, `<select>` or `<textarea>`, or an element or string that styles one: a placeholder, a wrapper that shows focus-within
// or a focused or checked child. Such a variant is `placeholder:`, `focus-within:`, `has-checked:`, `has-focus-visible:`, `has-[...focus|checked...]:`,
// an arbitrary `[&:focus-within]:` or `[&:has(:checked)]:`, or a `group-`/`peer-` form of those, with or without a breakpoint prefix.
// On one element the hairline and the variant may sit in different class literals (`class` and `:class`, or the two arms of a ternary): the whole tag counts.
import { classLiterals, classTokens } from './class-tokens.mjs';

/** An opening control tag, over lines; a `>` inside a quoted attribute value does not end it. */
const CONTROL_TAG = /<(?:input|select|textarea)\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
/** Any opening tag, element or component. */
const OPEN_TAG = /<[a-zA-Z][\w.-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const FIELD_STATE = String.raw`(?:placeholder|focus-within|has-checked|has-focus-visible|has-\[[^\]]*(?:focus|checked)[^\]]*\]|\[&[^\]]*(?:focus-within|focus-visible|checked|placeholder)[^\]]*\])`;
const FIELD_VARIANT = new RegExp(
  String.raw`^(?:(?:[a-z0-9-]+|\[[^\]]*\]):)*(?:(?:group|peer)(?:/[\w-]+)?-)?${FIELD_STATE}:`,
);
const HAIRLINE = /^(?:(?:sm|md|lg|xl|2xl):)*border-line(?:-strong)?$/;

const lineOf = (source, index) => source.slice(0, index).split('\n').length;
const hasFieldVariant = (tokens) => tokens.some((token) => FIELD_VARIANT.test(token));

/** The hairline border classes on the controls of one file, as `{ line, text }`. */
export function hairlineControlBorders(source) {
  const found = new Map();
  const add = (line, token) => found.set(`${line}:${token}`, { line, text: token });
  const addHairlines = (text, line) => {
    for (const token of classTokens(text)) if (HAIRLINE.test(token)) add(line, token);
  };
  const addTag = (match) => {
    const first = lineOf(source, match.index);
    match[0].split('\n').forEach((text, offset) => addHairlines(text, first + offset));
  };
  for (const match of source.matchAll(CONTROL_TAG)) addTag(match);
  for (const match of source.matchAll(OPEN_TAG))
    if (hasFieldVariant(classTokens(match[0]))) addTag(match);
  source.split('\n').forEach((text, index) => {
    for (const literal of classLiterals(text))
      if (hasFieldVariant(literal))
        for (const token of literal) if (HAIRLINE.test(token)) add(index + 1, token);
  });
  return [...found.values()].sort((first, second) => first.line - second.line);
}
