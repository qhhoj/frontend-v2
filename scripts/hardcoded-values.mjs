// The `hardcoded-value` rule of the raw-element ratchet (scripts/raw-element-rules.mjs): every value, from colour to
// spacing, comes from a variable, so a theme change swaps it in one place (DESIGN.md, "No hard-coded values").
// It finds four things outside src/theme/ (the home of the token sources):
// - a Tailwind arbitrary value with a literal number: `w-[420px]`, `top-[3px]`, `duration-[300ms]`, `leading-[1.2]`
//   (`-[var(--x)]` is a token and passes; `text-[Npx]`, `rounded-[]`, `z-[]` and `size-/h-/min-h-[Npx]` have their own rules);
// - a stock palette colour or white/black utility (`bg-red-500`, `text-white`): the theme drops that palette, so they render nothing;
// - an inline `style=` or `:style` with a literal number and unit (`width: 12px`, `` `${n}px` `` is computed and passes);
// - a literal px/rem/em/ms/s length in a `<style>` block or a .css file, outside a `--token: value` declaration.
// 0, 50% and 100% are structure, not design values, and pass. Colour literals (#fff, rgb()) are checked by check-tokens.mjs.
// Values computed at run time (FLIP transforms, chart geometry) go in ALLOWED with the reason.
import { classTokens, COMMENT_LINE, utilityOf } from './class-tokens.mjs';

/** Known exceptions, by file (path under src/) and the literal text of the hit, with the reason it is computed or structural. */
export const ALLOWED = {};

const UNIT = String.raw`(?:px|rem|em|ms|s|vh|vw|dvh|svh|lvh|ch|deg|%)`;
const LITERAL = new RegExp(String.raw`(?<![\w.$#-])(\d+(?:\.\d+)?)(${UNIT})(?![\w%])`, 'g');
const STRUCTURAL = new Set(['0', '50%', '100%']);
const isDesignValue = ([, number, unit]) =>
  Number(number) !== 0 && !STRUCTURAL.has(`${number}${unit}`);
/** The design values (a number with a unit, not 0, 50% or 100%) in a piece of CSS; `var(--x)` references are dropped first. */
const literalsIn = (css) =>
  [...css.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '').matchAll(LITERAL)]
    .filter(isDesignValue)
    .map(([text]) => text);

/** The token family to name in the message, by the utility's prefix. */
function family(utility) {
  const prefix = utility.replace(/^-/, '').split(/-\[/)[0];
  if (
    /^(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|translate-[xy])$/.test(
      prefix,
    )
  )
    return 'a spacing step (p-4, gap-2, inset-0)';
  if (/^(?:w|h|min-w|max-w|min-h|max-h|size|basis)$/.test(prefix))
    return 'a size step or a size token (size-4, w-64, min-h-(--qh-control))';
  if (/^(?:leading|tracking)$/.test(prefix))
    return 'the leading or tracking scale (leading-5, tracking-wide)';
  if (/^(?:duration|delay|ease)$/.test(prefix))
    return 'a motion token (--qh-duration-*, ease-standard)';
  if (/^(?:border|ring|outline|divide)/.test(prefix))
    return 'a border or ring width step (border, ring-2) and a colour token';
  if (/^(?:shadow|blur|drop-shadow)/.test(prefix)) return 'shadow-glow or shadow-float';
  if (/^text$/.test(prefix)) return 'the type scale (text-caption ... text-hero)';
  return 'a theme variable (add one in src/theme/styles.css)';
}

/** The utilities that already have their own rule, so this rule leaves them. */
const COVERED =
  /^(?:text-\[[\d.]+(?:px|r?em)\](?:\/\S+)?|rounded(?:-[a-z]{1,2})?-\[[^\]]+\]|z-\[[^\]]+\]|(?:size|h|min-h)-\[[\d.]+(?:px|rem)\])$/;
const ARBITRARY = /^(-?[a-z][a-z0-9-]*)-\[([^\]]*)\]/;
const NUMERIC_FAMILY =
  /^(?:leading|tracking|opacity|duration|delay|scale|rotate|skew|order|line-clamp)$/;

/** Hits of a class word that carries an arbitrary literal value. */
function arbitraryHit(token) {
  const utility = utilityOf(token);
  const match = ARBITRARY.exec(utility);
  if (!match || COVERED.test(utility)) return [];
  const [, prefix, value] = match;
  const hasLiteral =
    literalsIn(value).length > 0 ||
    (NUMERIC_FAMILY.test(prefix.replace(/^-/, '')) &&
      /\d/.test(value.replace(/var\([^)]*\)/g, '')));
  return hasLiteral ? [{ text: token, use: family(utility) }] : [];
}

const PALETTE =
  /^(?:bg|text|border(?:-[xytblrse])?|ring|ring-offset|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret|placeholder)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|white|black)(?:\/\d+)?$/;

const paletteHit = (token) =>
  PALETTE.test(utilityOf(token))
    ? [
        {
          text: token,
          use: 'a semantic colour token (text-content, bg-surface, text-on-accent, border-line...; the stock palette renders nothing)',
        },
      ]
    : [];

/** The class-word hits of one line (comment lines give none). */
const classHits = (line) =>
  classTokens(line).flatMap((token) => [...arbitraryHit(token), ...paletteHit(token)]);

const STYLE_ATTR = /(?:^|[\s<])(?::|v-bind:)?style\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))/;
const STYLE_USE =
  'a Tailwind class (w-64, p-4) or a variable (var(--qh-...)); a computed value goes in ALLOWED with its reason';

/** The literals of an inline style on one line. */
function inlineStyleHits(line) {
  const match = STYLE_ATTR.exec(line);
  const value = match ? (match[1] ?? match[2] ?? match[3]) : '';
  return literalsIn(value).map((text) => ({ text: `style ${text}`, use: STYLE_USE }));
}

const STYLE_BLOCK = /<style\b[\s\S]*?<\/style>/g;
const CUSTOM_PROPERTY = /^\s*--[\w-]+\s*:/;
const AT_RULE = /^\s*@/;

/** The literals of one CSS line: not a `--token: value` declaration (that is the token's source) and not an at-rule line (a media query cannot read a variable). */
const cssLineHits = (line) =>
  CUSTOM_PROPERTY.test(line) || AT_RULE.test(line) || COMMENT_LINE.test(line)
    ? []
    : literalsIn(line.replace(/\/\*.*?\*\//g, '')).map((text) => ({
        text,
        use: 'a var(--...) token (--qh-radius-*, --qh-duration-*, --text-*) or add one in src/theme/',
      }));

/** The line numbers (1-based) of a .vue file that sit inside a <style> block. */
function styleLines(source) {
  const lines = new Set();
  for (const block of source.matchAll(STYLE_BLOCK)) {
    const first = source.slice(0, block.index).split('\n').length;
    block[0].split('\n').forEach((_, offset) => lines.add(first + offset));
  }
  return lines;
}

/** Every hard-coded value of one file, as `{ line, text }` (text names the family to use). */
export function hardcodedValues(source, rel) {
  if (rel.startsWith('theme/')) return [];
  const isCss = rel.endsWith('.css');
  const inStyle = rel.endsWith('.vue') ? styleLines(source) : new Set();
  const allowed = ALLOWED[rel] ?? {};
  return source.split('\n').flatMap((line, index) => {
    const number = index + 1;
    const hits =
      isCss || inStyle.has(number)
        ? cssLineHits(line)
        : [...classHits(line), ...(rel.endsWith('.vue') ? inlineStyleHits(line) : [])];
    return hits
      .filter(({ text }) => !(text in allowed))
      .map(({ text, use }) => ({ line: number, text: `${text} -> ${use}` }));
  });
}
