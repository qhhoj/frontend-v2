// The script half of the `hardcoded-value` family (scripts/hardcoded-values.mjs): the rule `hardcoded-script-value`.
// Every colour, size, spacing, radius, shadow, z-index and duration comes from a token, in script code too (DESIGN.md,
// "No hard-coded values"). It finds four cases in .ts files and in the <script> and :style of .vue files under src/
// (not specs, not src/theme/, the token sources):
// - unit-string: a string literal with a CSS unit: '12px', '1.5rem', '300ms', `calc(100% - 12px)`;
// - delay: a literal number as the wait of setTimeout/setInterval/debounce/throttle (useDebounceFn, useTimeoutFn...)
//   or as a `duration:` / `delay:` key (Element.animate, transition helpers);
// - style-number: a literal number assigned to `el.style.<prop>` or given to a layout key (width, top, padding, gap,
//   fontSize, borderRadius, zIndex...) of a style object (`:style`, or an object near the word "style");
// - ui-constant: a number in a constant named for a UI size: `ROW_HEIGHT = 44`, `*_PX`, `*_MS`, `*_WIDTH`, `*_GAP`...
// A media-query string (`(max-width: 767.98px)`) passes: a query cannot read a variable (as the at-rule lines of CSS).
// 0, 1, -1, 100 (percent), array indices, page sizes, limits and arithmetic are not design values and pass.
// Use instead: `durationMs('fast')` (src/theme/motion.ts), `sizePx('control')` (src/theme/sizes.ts), a CSS class or a
// `var(--qh-...)` string. Geometry computed at run time goes in SCRIPT_ALLOWED with its reason.

/** Known exceptions, by file (path under src/) and the literal text of the hit, each with the reason it is computed. */
export const SCRIPT_ALLOWED = {};

export const SCRIPT_RULE = 'hardcoded-script-value';
export const SCRIPT_USE =
  'a token module (durationMs/sizePx in src/theme/, DESIGN.md "No hard-coded values")';

const NOT_DESIGN = new Set(['0', '1', '-1', '100']);
const isDesignNumber = (text) => !NOT_DESIGN.has(text.replace(/_/g, ''));

/** The source with comments blanked (newlines kept), so line numbers stay and commented code is not read. */
export function withoutComments(source) {
  let out = '';
  let quote = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') out += source[++i] ?? '';
      else if (c === quote) quote = '';
    } else if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
    } else {
      if (c === '"' || c === "'" || c === '`') quote = c;
      out += c;
    }
  }
  return out;
}

/** The text of the <script> blocks of a .vue file with everything else blanked; a .ts file is all script. */
function scriptOnly(source, rel) {
  if (!rel.endsWith('.vue')) return source;
  const keep = new Array(source.length).fill(false);
  for (const block of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const start = block.index + block[0].indexOf('>') + 1;
    for (let i = start; i < start + block[1].length; i++) keep[i] = true;
  }
  return [...source].map((char, index) => (keep[index] || char === '\n' ? char : ' ')).join('');
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const hit = (text, index, match, use) => ({ line: lineOf(text, index), text: match, use });

const QUOTED = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const UNIT_NUMBER = /(?<![\w.$#-])(\d+(?:\.\d+)?)(px|rem|em|ms|s)(?![\w%])/;
const unitStrings = (text) =>
  [...text.matchAll(QUOTED)].flatMap((match) => {
    const body = match[2].replace(/var\([^()]*\)/g, '');
    if (/-\[/.test(body)) return []; // a Tailwind arbitrary class: rule hardcoded-value
    if (/^\s*\((?:min|max)-(?:width|height)\s*:[^)]*\)/.test(body)) return []; // a media query cannot read a variable
    const found = UNIT_NUMBER.exec(body);
    return found && Number(found[1]) !== 0
      ? [
          hit(
            text,
            match.index,
            match[0],
            'a token: a class, var(--qh-...) or sizePx()/durationMs()',
          ),
        ]
      : [];
  });

const WAIT_CALL =
  /\b(setTimeout|setInterval|debounce|throttle|useDebounceFn|useThrottleFn|refDebounced|refThrottled|useTimeoutFn|useIntervalFn|useTimeout)\s*\(/g;

/** The top-level arguments of the call whose `(` is at `open`, with their offsets; strings and nested brackets are skipped. */
function callArguments(text, open) {
  const args = [];
  let depth = 0;
  let quote = '';
  let start = open + 1;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) {
      depth--;
      if (depth === 0) {
        args.push({ at: start, text: text.slice(start, i).trim() });
        return args;
      }
    } else if (c === ',' && depth === 1) {
      args.push({ at: start, text: text.slice(start, i).trim() });
      start = i + 1;
    }
  }
  return args;
}

const NUMBER = /^-?\d[\d_]*(?:\.\d+)?$/;
const waitHits = (text) => [
  ...[...text.matchAll(WAIT_CALL)].flatMap((call) =>
    callArguments(text, call.index + call[0].length - 1)
      .slice(1)
      .filter(({ text: arg }) => NUMBER.test(arg) && isDesignNumber(arg))
      .map(({ text: arg }) =>
        hit(text, call.index, `${call[1]}(..., ${arg})`, 'durationMs(...) of src/theme/motion.ts'),
      ),
  ),
  ...[...text.matchAll(/\b(duration|delay)\s*:\s*(\d[\d_.]*)(?![\w.])/g)]
    .filter((match) => isDesignNumber(match[2]))
    .map((match) => hit(text, match.index, match[0], 'durationMs(...) of src/theme/motion.ts')),
];

const LAYOUT_KEY =
  'width|height|minWidth|maxWidth|minHeight|maxHeight|top|left|right|bottom|inset|margin\\w*|padding\\w*|gap|rowGap|columnGap|fontSize|lineHeight|borderRadius|zIndex|letterSpacing|borderWidth|outlineWidth';
const STYLE_ASSIGN = new RegExp(
  `\\.style\\.(${LAYOUT_KEY})\\s*=\\s*(-?\\d[\\d_.]*)(?![\\w.])`,
  'g',
);
const STYLE_KEY = new RegExp(`(?<![\\w.])(${LAYOUT_KEY})\\s*:\\s*(-?\\d[\\d_.]*)(?![\\w.%])`, 'g');
const STYLE_CONTEXT = /[sS]tyle\b|CSSProperties|StyleValue/;
const styleUse = 'a class, var(--qh-...) or sizePx(...) of src/theme/sizes.ts';

const styleHits = (text) => {
  const lines = text.split('\n');
  const assigns = [...text.matchAll(STYLE_ASSIGN)]
    .filter((match) => isDesignNumber(match[2]))
    .map((match) => hit(text, match.index, match[0], styleUse));
  const keys = lines.flatMap((line, index) => {
    const near = lines.slice(Math.max(0, index - 6), index + 1).join('\n');
    if (!STYLE_CONTEXT.test(near)) return [];
    return [...line.matchAll(STYLE_KEY)]
      .filter((match) => isDesignNumber(match[2]))
      .map((match) => ({ line: index + 1, text: match[0], use: styleUse }));
  });
  return [...assigns, ...keys];
};

/** `:style="{ width: 12 }"` in a .vue template: the number-valued layout keys of an object bound on one line. */
function templateStyleHits(source) {
  return source.split('\n').flatMap((line, index) => {
    const match = /(?::|v-bind:)style\s*=\s*"([^"]*)"/.exec(line);
    if (!match) return [];
    return [...match[1].matchAll(STYLE_KEY)]
      .filter((key) => isDesignNumber(key[2]))
      .map((key) => ({ line: index + 1, text: `:style ${key[0]}`, use: styleUse }));
  });
}

const UI_NAME =
  /(?:_(?:PX|MS|HEIGHT|WIDTH|GAP|RADIUS|DURATION|DELAY)|[a-z](?:Px|Ms|Height|Width|Gap|Radius|Duration|Delay))$/;
const CONSTANT =
  /(?:\b(?:const|let|var)\s+|^\s*(?:readonly\s+)?|\bstatic\s+)([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?[=:]\s*(-?\d[\d_.]*)\s*(?:as const)?\s*[;,]?\s*$/gm;
const constantHits = (text) =>
  [...text.matchAll(CONSTANT)]
    .filter((match) => UI_NAME.test(match[1]) && isDesignNumber(match[2]))
    .map((match) =>
      hit(
        text,
        match.index,
        `${match[1]} = ${match[2]}`,
        'a token module (src/theme/motion.ts, src/theme/sizes.ts) or a CSS variable',
      ),
    );

const CASES = [
  ['unit-string', unitStrings],
  ['delay', waitHits],
  ['style-number', styleHits],
  ['ui-constant', constantHits],
];

/** Every hard-coded value in the script code of one file, as `{ line, text, kind }` (text names what to use). */
export function hardcodedScriptValues(source, rel) {
  if (rel.startsWith('theme/') || rel.endsWith('.css')) return [];
  const code = withoutComments(scriptOnly(source, rel));
  const allowed = SCRIPT_ALLOWED[rel] ?? {};
  const found = CASES.flatMap(([kind, find]) => find(code).map((use) => ({ ...use, kind })));
  const template = rel.endsWith('.vue')
    ? templateStyleHits(source).map((use) => ({ ...use, kind: 'style-number' }))
    : [];
  return [...found, ...template]
    .filter(({ text }) => !(text in allowed))
    .sort((first, second) => first.line - second.line)
    .map(({ line, text, use, kind }) => ({ line, kind, text: `${kind}: ${text} -> ${use}` }));
}
