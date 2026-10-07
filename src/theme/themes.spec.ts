import { describe, expect, it } from 'vitest';
import { contrastRatio, over, parseColour } from '@/test/contrast';
import type { Rgba } from '@/test/contrast';
import globalTokensCss from './tokens.css?raw';
import { THEMES } from './registry';
import stylesCss from './styles.css?raw';

const themeFiles = import.meta.glob<string>('./themes/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const sources = import.meta.glob<string>(
  [
    '/src/**/*.{vue,ts,css}',
    '!/src/**/*.spec.ts',
    '!/src/theme/themes/*.css',
    '!/src/theme/tokens.css',
  ],
  { query: '?raw', import: 'default', eager: true },
);

const declarations = (css: string) =>
  new Map(
    [...css.matchAll(/--qh-([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name!,
      value!.trim(),
    ]),
  );
const globalNames = new Set(declarations(globalTokensCss).keys());
const usedNames = new Set(
  Object.values(sources).flatMap((source) =>
    [...source.matchAll(/var\(--qh-([\w-]+)/g)].map(([, name]) => name!),
  ),
);
const themes = Object.entries(themeFiles).map(([path, css]) => ({
  id: /([\w-]+)\.css$/.exec(path)![1]!,
  css,
  tokens: declarations(css),
}));

const BLOBS = ['blob-1', 'blob-2', 'blob-3'];
const COINS = [1, 2, 3, 4, 5, 6].map((index) => `coin-${index}`);

/** Tokens used as text colour directly on a ground. */
const TEXT_TOKENS = [
  'text',
  'text-muted',
  'accent-text',
  'positive',
  'negative',
  'focus-ring',
  'tier-none',
  'tier-newbie',
  'tier-pupil',
  'tier-specialist',
  'tier-expert',
  'tier-candidate-master',
  'tier-master',
  'tier-grandmaster',
];
/** Text token and the tint it sits on. */
const TINT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['verdict-ac', 'verdict-ac-bg'],
  ['verdict-wa', 'verdict-wa-bg'],
  ['verdict-tle', 'verdict-tle-bg'],
  ['verdict-rte', 'verdict-rte-bg'],
  ['verdict-ce', 'verdict-ce-bg'],
  ['verdict-pending', 'verdict-pending-bg'],
  ['verdict-partial', 'partial-bg-1'],
  ['verdict-partial', 'partial-bg-2'],
  ['verdict-partial', 'partial-bg-3'],
  ['accent-soft-text', 'accent-soft'],
  ['first-solve-text', 'first-solve-bg'],
  ['first-solve-text', 'first-solve-bg-2'],
  ['positive', 'verdict-ac-bg'],
  ['negative', 'verdict-wa-bg'],
];

/** Verdict and accent tints with their dedicated text colour, plus plain body text on each tint. */
const TINTED_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ...TINT_PAIRS,
  ...[...new Set(TINT_PAIRS.map(([, tint]) => tint))].map((tint) => ['text', tint] as const),
];
const allTokenNames = new Set(themes.flatMap(({ tokens }) => [...tokens.keys()]));

describe.each(themes)('theme $id', ({ id, css, tokens }) => {
  const colour = (name: string): Rgba => {
    const value = tokens.get(name);
    if (!value) throw new Error(`${id} does not define --qh-${name}`);
    return parseColour(value);
  };

  it('is selected by its data-theme attribute', () => {
    expect(css).toContain(`[data-theme='${id}']`);
  });

  it('defines the same tokens as every other theme', () => {
    expect([...allTokenNames].filter((name) => !tokens.has(name))).toEqual([]);
  });

  it('defines every token the stylesheets and components use', () => {
    expect([...usedNames].filter((name) => !globalNames.has(name) && !tokens.has(name))).toEqual(
      [],
    );
  });

  it('keeps text at 4.5:1 on every ground, every blob centre and the opaque fallback included', () => {
    const ground = colour('ground');
    const solid = over(colour('surface-solid'), ground);
    const grounds: Record<string, Rgba> = {
      ground,
      'opaque fallback': solid,
      'hover over opaque fallback': over(colour('surface-hover'), solid),
    };
    for (const blob of BLOBS) {
      const glass = over(colour('surface'), over(colour(blob), ground));
      grounds[`glass over ${blob}`] = glass;
      grounds[`hover row over ${blob}`] = over(colour('surface-hover'), glass);
      grounds[`inner tile over ${blob}`] = over(colour('surface-strong'), glass);
    }
    const failures = Object.entries(grounds).flatMap(([groundName, groundColour]) =>
      [
        ...TEXT_TOKENS.map((name) => [name, contrastRatio(colour(name), groundColour)] as const),
        ...TINTED_PAIRS.map(
          ([text, tint]) =>
            [
              `${text} on ${tint}`,
              contrastRatio(colour(text), over(colour(tint), groundColour)),
            ] as const,
        ),
      ]
        .filter(([, ratio]) => ratio < 4.5)
        .map(([name, ratio]) => `${name} on ${groundName}: ${ratio.toFixed(2)}`),
    );
    expect(failures).toEqual([]);
  });

  it('keeps text on both accent fills at 4.5:1', () => {
    for (const fill of ['accent', 'accent-2'])
      expect(contrastRatio(colour('on-accent'), colour(fill))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps coin text at 4.5:1 on both stops of every coin gradient', () => {
    const failures = COINS.flatMap((coin) => {
      const stops = [...(tokens.get(coin) ?? '').matchAll(/#[0-9a-f]{6}/gi)].map(([stop]) => stop);
      expect(stops, `${coin} needs two hex stops`).toHaveLength(2);
      return stops
        .map(
          (stop) =>
            [`${coin} ${stop}`, contrastRatio(colour('on-coin'), parseColour(stop))] as const,
        )
        .filter(([, ratio]) => ratio < 4.5)
        .map(([name, ratio]) => `${name}: ${ratio.toFixed(2)}`);
    });
    expect(failures).toEqual([]);
  });
});

describe('theme registry', () => {
  it('has a CSS file for every registered theme and registers every CSS file', () => {
    expect(themes.map((theme) => theme.id).sort()).toEqual(THEMES.map((theme) => theme.id).sort());
  });

  it('imports every registered theme in styles.css', () => {
    const missing = THEMES.filter(
      (theme) => !stylesCss.includes(`@import './themes/${theme.id}.css';`),
    ).map((theme) => theme.id);
    expect(missing).toEqual([]);
  });

  it('declares the colour-scheme its registry entry claims', () => {
    const mismatched = THEMES.filter(
      (theme) =>
        !new RegExp(`color-scheme:\\s*${theme.scheme}\\s*;`).test(
          themes.find((file) => file.id === theme.id)?.css ?? '',
        ),
    ).map((theme) => theme.id);
    expect(mismatched).toEqual([]);
  });
});
