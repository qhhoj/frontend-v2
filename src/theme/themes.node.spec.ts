import { describe, expect, it } from 'vitest';
import { colourDistance, contrastRatio, over, parseColour } from '@/test/contrast';
import type { Rgba } from '@/test/contrast';
import { ACCENTS } from './appearance';
import globalTokensCss from './tokens.css?raw';
import accentsCss from './palette/accents.css?raw';
import contrastCss from './palette/contrast-high.css?raw';
import darkCss from './palette/paper-dark.css?raw';
import lightCss from './palette/paper-light.css?raw';

// `npm run lint:palette` proves the generated pairs (scripts/palette/checks.mjs). This spec checks what the CSS
// composes on top: the cascade of mode, contrast and accent rules, and the mode-free roles of tokens.css.

const sources = import.meta.glob<string>(
  [
    '/src/**/*.{vue,ts,css}',
    '!/src/**/*.spec.ts',
    '!/src/theme/palette/*.css',
    '!/src/theme/tokens.css',
  ],
  { query: '?raw', import: 'default', eager: true },
);

type Tokens = Map<string, string>;
const declarations = (css: string): Tokens =>
  new Map(
    [...css.matchAll(/--qh-([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name!,
      value!.trim(),
    ]),
  );
/** The declarations of the first rule whose selector list contains `selector`. */
const ruleOf = (css: string, selector: string): Tokens => {
  const rule = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)].find(
    ([, selectors]) => selectors!.split(',').some((candidate) => candidate.trim() === selector),
  );
  if (!rule) throw new Error(`no rule ${selector}`);
  return declarations(rule[2]!);
};

const globalTokens = declarations(globalTokensCss);
const MODES = { light: lightCss, dark: darkCss } as const;
const LEVELS = ['standard', 'high'] as const;

/** The tokens one page gets: the mode, then the contrast overlay, the accent rule, and tokens.css's roles over them. */
function variantTokens(mode: keyof typeof MODES, level: (typeof LEVELS)[number], accent: string) {
  const root = `:root[data-theme='${mode}']${level === 'high' ? "[data-contrast='high']" : ''}`;
  return new Map([
    ...globalTokens,
    ...declarations(MODES[mode]),
    ...(level === 'high' ? ruleOf(contrastCss, root) : []),
    ...ruleOf(accentsCss, `${root}[data-accent='${accent}']`),
  ]);
}

const variants = (Object.keys(MODES) as Array<keyof typeof MODES>).flatMap((mode) =>
  LEVELS.flatMap((level) =>
    ACCENTS.map(({ id }) => ({
      label: `${mode}/${level}/${id}`,
      tokens: variantTokens(mode, level, id),
    })),
  ),
);

/** A token's colour, following `var(--qh-…)` aliases. */
const colourOf =
  (tokens: Tokens, label: string) =>
  (name: string): Rgba => {
    let value = tokens.get(name);
    for (let depth = 0; value?.startsWith('var(--qh-') && depth < 5; depth++)
      value = tokens.get(/^var\(--qh-([\w-]+)\)$/.exec(value)![1]!);
    if (!value) throw new Error(`${label} does not define --qh-${name}`);
    return parseColour(value);
  };

const TIERS = [
  'tier-newbie',
  'tier-pupil',
  'tier-specialist',
  'tier-expert',
  'tier-candidate-master',
  'tier-master',
  'tier-grandmaster',
];
const ROWS = ['surface', 'surface-strong', 'surface-hover'];
/** Role text on the role's tint, for the roles tokens.css derives. */
const ROLE_PAIRS = [
  ['positive', 'positive-bg'],
  ['negative', 'negative-bg'],
  ['warning', 'warning-bg'],
  ['info', 'info-bg'],
  ['notice-info', 'notice-info-bg'],
  ['limit-time', 'limit-time-bg'],
  ['limit-memory', 'limit-memory-bg'],
  ['limit-points', 'limit-points-bg'],
  ['tag-7', 'tag-7-bg'],
  ['tag-8', 'tag-8-bg'],
  ['verdict-partial', 'partial-bg-1'],
  ['verdict-partial', 'partial-bg-2'],
  ['verdict-partial', 'partial-bg-3'],
  ['text-muted', 'accent-soft'],
  ...['tier-none', ...TIERS].map((tier) => [tier, 'accent-soft']),
] as const;
/** Label text on a solid fill. */
const SOLID_PAIRS = [
  ['on-caution-strong', 'caution-strong'],
  ['verdict-sys-on', 'verdict-sys-solid'],
  ['first-solve-text', 'first-solve-bg'],
  ['on-accent', 'accent-2'],
] as const;

describe.each(variants)('palette $label', ({ label, tokens }) => {
  const colour = colourOf(tokens, label);
  const ground = colour('ground');
  const onGround = (name: string) => over(colour(name), ground);

  it('keeps each derived role readable (4.5:1) on its tint over the ground and every card row', () => {
    const failures = ROLE_PAIRS.flatMap(([text, tint]) =>
      ['ground', ...ROWS].map(
        (base) =>
          [
            `${text} on ${tint} over ${base}`,
            contrastRatio(colour(text), over(colour(tint), onGround(base))),
          ] as const,
      ),
    ).filter(([, ratio]) => ratio < 4.5);
    expect(failures).toEqual([]);
  });

  it('keeps each label readable (4.5:1) on its solid fill', () => {
    const failures = SOLID_PAIRS.map(
      ([text, fill]) =>
        [`${text} on ${fill}`, contrastRatio(colour(text), onGround(fill))] as const,
    ).filter(([, ratio]) => ratio < 4.5);
    expect(failures).toEqual([]);
  });
});

describe.each(Object.entries(MODES))('palette %s', (mode, css) => {
  const tokens = new Map([...globalTokens, ...declarations(css)]);
  const colour = colourOf(tokens, mode);
  const onGround = (name: string) => over(colour(name), colour('ground'));

  it('defines every token the stylesheets and components use', () => {
    const used = new Set(
      Object.values(sources).flatMap((source) =>
        [...source.matchAll(/var\(--qh-([\w-]+)/g)].map(([, name]) => name!),
      ),
    );
    // A name ending in a dash is a template prefix (`var(--qh-syntax-${token})`).
    expect([...used].filter((name) => !name.endsWith('-') && !tokens.has(name))).toEqual([]);
  });

  it('keeps adjacent rating tiers at least 20 apart in CIELAB (CIE76), newbie to grandmaster', () => {
    const close = TIERS.slice(1)
      .map(
        (tier, index) =>
          [
            `${TIERS[index]} / ${tier}`,
            colourDistance(colour(TIERS[index]!), colour(tier)),
          ] as const,
      )
      .filter(([, distance]) => distance < 20);
    expect(close).toEqual([]);
  });

  it('draws a skeleton block that stands out from the card and from an inner tile', () => {
    for (const base of ['surface', 'surface-strong'])
      expect(
        contrastRatio(onGround('skeleton'), onGround(base)),
        `skeleton on ${base}`,
      ).toBeGreaterThanOrEqual(1.1);
  });

  it('draws the problem list graphics (difficulty squares, empty status ring) at 3:1 on every card row', () => {
    const failures = ['diff-1', 'diff-2', 'diff-3', 'diff-4', 'text-muted'].flatMap((name) =>
      ROWS.filter((row) => contrastRatio(colour(name), onGround(row)) < 3).map(
        (row) => `${name} on ${row}`,
      ),
    );
    expect(failures).toEqual([]);
  });

  it('keeps coin text at 4.5:1 on both stops of every coin and the QR code at 7:1', () => {
    for (const coin of [1, 2, 3, 4, 5, 6])
      for (const [stop] of tokens.get(`coin-${coin}`)!.matchAll(/#[0-9a-f]{6}/gi))
        expect(
          contrastRatio(colour('on-coin'), parseColour(stop)),
          `coin-${coin} ${stop}`,
        ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colour('qr-ink'), colour('qr-paper'))).toBeGreaterThanOrEqual(7);
  });
});
