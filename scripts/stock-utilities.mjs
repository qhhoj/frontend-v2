// Tailwind's stock radius and shadow utilities that `@theme` resets (--radius-*: initial, --shadow-*: initial): they generate no CSS, so the element renders square or flat.
// The project's role names (rounded-cell, rounded-pill, shadow-glow, ...) are not matched.
const STOCK =
  /^(?:rounded(?:-(?:[tblrse]|tl|tr|bl|br|ss|se|ee|es))?(?:-(?:xs|sm|md|lg|xl|2xl|3xl))?|shadow(?:-(?:xs|sm|md|lg|xl|2xl))?)$/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const QUOTED = /(['"`])((?:(?!\1).)*)\1/g;

/** The stock class names used in the string literals of one source line; comment lines are ignored. */
export const stockUtilities = (line) =>
  COMMENT_LINE.test(line)
    ? []
    : [...line.matchAll(QUOTED)]
        .flatMap(([, , text]) => text.split(/\s+/))
        .map((token) => token.replace(/^.*:/, '').replace(/^[!-]/, ''))
        .filter((name) => STOCK.test(name));
