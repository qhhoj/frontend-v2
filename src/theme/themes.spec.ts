import { describe, expect, it } from 'vitest';
import { contrastRatio, mixPremultiplied, over, parseColour } from '@/test/contrast';
import type { Rgba } from '@/test/contrast';
import { ACCENTS } from './appearance';
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

/** A name ending in a dash is a template prefix (`var(--qh-syntax-${token})`); its members are checked as SYNTAX_TOKENS. */
for (const name of usedNames) if (name.endsWith('-')) usedNames.delete(name);

interface Rule {
  /** The preset a rule belongs to; `null` for the base rule. */
  accent: string | null;
  selector: string;
  tokens: Map<string, string>;
}
/** A theme file is one base rule plus one rule per accent preset; parsed per rule so a preset never overwrites the base. */
const rulesOf = (css: string): Rule[] =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({
    accent: /\[data-accent='([\w-]+)'\]/.exec(selector!)?.[1] ?? null,
    selector: selector!.trim(),
    tokens: declarations(body!),
  }));
const themes = Object.entries(themeFiles).map(([path, css]) => {
  const rules = rulesOf(css);
  return {
    id: /([\w-]+)\.css$/.exec(path)![1]!,
    css,
    tokens: new Map(
      rules.filter((rule) => rule.accent === null).flatMap((rule) => [...rule.tokens]),
    ),
    presets: new Map(
      rules.filter((rule) => rule.accent !== null).map((rule) => [rule.accent!, rule]),
    ),
  };
});
const entryOf = (themeId: string) => THEMES.find((theme) => theme.id === themeId)!;

const BLOBS = ['blob-1', 'blob-2', 'blob-3'];
const COINS = [1, 2, 3, 4, 5, 6].map((index) => `coin-${index}`);
const SYNTAX_TOKENS = ['keyword', 'type', 'number', 'string', 'comment', 'function'].map(
  (name) => `syntax-${name}`,
);
/** What an accent preset overrides, in every theme. Verdict, first-solve, tier, coin and syntax tokens never follow the accent. */
const ACCENT_TOKENS = [
  'surface-hover',
  'line-accent',
  'accent',
  'accent-2',
  'accent-text',
  'accent-soft',
  'accent-soft-text',
  'on-accent',
  'focus-ring',
  'gradient-accent',
  'glow',
  'blob-1',
  'blob-2',
  'blob-3',
];
/** Personal Glass levels checked; 0 is the worst case (most see-through), 100 is the opaque fallback. */
const GLASS_LEVELS = [0, 25, 50, 75, 100];

/** Tokens used as text colour directly on a ground; the syntax colours are drawn on the inner tile, which this check also covers. */
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
  ...SYNTAX_TOKENS,
];
/** Contest tag chips (backend `TagColor`): text token on its own tint, eight of them. */
const TAG_COUNT = 8;
const TAG_PAIRS: ReadonlyArray<readonly [string, string]> = Array.from(
  { length: TAG_COUNT },
  (_unused, index) => [`tag-${index + 1}`, `tag-${index + 1}-bg`] as const,
);

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
  ['text-muted', 'accent-soft'],
  ['positive', 'verdict-ac-bg'],
  ['negative', 'verdict-wa-bg'],
  ...TAG_PAIRS,
];

/** Verdict and accent tints with their dedicated text colour, plus plain body text on each tint. */
const TINTED_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ...TINT_PAIRS,
  /** A solid fill with its own text colour (body text is not drawn on it). */
  ['first-solve-text', 'first-solve-bg'],
  ['first-solve-text', 'first-solve-bg-2'],
  ...[...new Set(TINT_PAIRS.map(([, tint]) => tint))].map((tint) => ['text', tint] as const),
];
const allTokenNames = new Set(themes.flatMap(({ tokens }) => [...tokens.keys()]));

/** Every theme with every accent preset applied over its base tokens; the native preset's variant is the base itself. */
const variants = themes.flatMap(({ id, tokens, presets }) =>
  ACCENTS.map(({ id: accent }) => ({
    theme: id,
    accent,
    tokens: new Map([...tokens, ...(presets.get(accent)?.tokens ?? [])]),
  })),
);

const colourOf =
  (tokens: ReadonlyMap<string, string>, label: string) =>
  (name: string): Rgba => {
    const value = tokens.get(name);
    if (!value) throw new Error(`${label} does not define --qh-${name}`);
    return parseColour(value);
  };

/**
 * Text pairs under 4.5:1 on every ground a look can produce: the ground, the opaque fallback, and the live glass
 * (the surface mixed toward solid by `glass`) over every blob peak and every blob pair, with the hover and inner-tile
 * overlays. Blobs are at full strength (Glow 100), the worst case; Glass 0 is the most see-through.
 */
function contrastFailures(tokens: ReadonlyMap<string, string>, label: string, glass: number) {
  const colour = colourOf(tokens, label);
  const ground = colour('ground');
  const solid = over(colour('surface-solid'), ground);
  const surface = mixPremultiplied(colour('surface-solid'), colour('surface'), glass / 100);
  const grounds: Record<string, Rgba> = {
    ground,
    'opaque fallback': solid,
    'hover over opaque fallback': over(colour('surface-hover'), solid),
  };
  // Blob centres sit at least one radius apart, so where two blobs overlap their falloffs add up to at most
  // one peak: the compound is checked with each pair at half strength (the single peaks are the other extreme).
  const halfStrength = (blob: string): Rgba => {
    const [red, green, blue, alpha] = colour(blob);
    return [red, green, blue, alpha / 2];
  };
  const blobStacks = [
    ...BLOBS.map((blob) => ({ name: blob, layers: [colour(blob)] })),
    ...BLOBS.flatMap((first, index) =>
      BLOBS.slice(index + 1).map((second) => ({
        name: `${first} + ${second}`,
        layers: [halfStrength(first), halfStrength(second)],
      })),
    ),
  ];
  for (const { name, layers } of blobStacks) {
    const blobGround = layers.reduce((below, layer) => over(layer, below), ground);
    const glassOver = over(surface, blobGround);
    grounds[`glass over ${name}`] = glassOver;
    grounds[`hover row over ${name}`] = over(colour('surface-hover'), glassOver);
    grounds[`inner tile over ${name}`] = over(colour('surface-strong'), glassOver);
  }
  return Object.entries(grounds).flatMap(([groundName, groundColour]) =>
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
}

/** Hue in degrees of an opaque colour. */
function hueOf([red, green, blue]: Rgba) {
  const [max, min] = [Math.max(red, green, blue), Math.min(red, green, blue)];
  const hue =
    max === red
      ? ((green - blue) / (max - min)) * 60
      : max === green
        ? (2 + (blue - red) / (max - min)) * 60
        : (4 + (red - green) / (max - min)) * 60;
  return (hue + 360) % 360;
}

describe.each(themes)('theme $id', ({ id, css, tokens, presets }) => {
  const colour = colourOf(tokens, id);

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

  it('defines exactly the registered accent presets', () => {
    expect([...presets.keys()].sort()).toEqual(ACCENTS.map((accent) => accent.id).sort());
  });

  it('gives every preset the same accent tokens, selectable on the root and on a swatch', () => {
    const failures = ACCENTS.flatMap(({ id: accent }) => {
      const preset = presets.get(accent);
      if (!preset) return [`${accent}: missing`];
      const names = [...preset.tokens.keys()];
      return [
        ...ACCENT_TOKENS.filter((name) => !names.includes(name)).map(
          (name) => `${accent}: missing --qh-${name}`,
        ),
        ...names
          .filter((name) => !ACCENT_TOKENS.includes(name))
          .map((name) => `${accent}: --qh-${name} is not an accent token`),
        ...[
          `:root[data-theme='${id}'][data-accent='${accent}']`,
          `:root[data-theme='${id}'] [data-accent='${accent}']`,
        ]
          .filter((selector) => !preset.selector.includes(selector))
          .map((selector) => `${accent}: selector lacks ${selector}`),
      ];
    });
    expect(failures).toEqual([]);
  });

  it("keeps the base equal to exactly one preset, the registry's accent for this theme", () => {
    const native = ACCENTS.filter(({ id: accent }) =>
      ACCENT_TOKENS.every((name) => presets.get(accent)?.tokens.get(name) === tokens.get(name)),
    ).map((accent) => accent.id);
    expect(native).toEqual([entryOf(id).accent]);
  });

  it('gives the six syntax tokens six different colours', () => {
    const values = SYNTAX_TOKENS.map((name) => tokens.get(name));
    expect(new Set(values).size).toBe(SYNTAX_TOKENS.length);
  });

  it('gives the eight tag chips eight different text colours and eight different tints', () => {
    const texts = TAG_PAIRS.map(([text]) => tokens.get(text));
    const tints = TAG_PAIRS.map(([, tint]) => tokens.get(tint));
    expect(texts.every(Boolean) && tints.every(Boolean)).toBe(true);
    expect(new Set(texts).size).toBe(TAG_COUNT);
    expect(new Set(tints).size).toBe(TAG_COUNT);
  });

  it('is flat or frosted exactly as its registry entry says', () => {
    if (entryOf(id).glass) {
      expect(tokens.get('blur')).toMatch(/^[1-9]\d*px$/);
      expect(tokens.get('blob-display')).toBe('block');
      return;
    }
    expect(tokens.get('blur')).toBe('0px');
    expect(tokens.get('blob-display')).toBe('none');
    // Opaque everywhere: a personal Glass level has nothing to mix, and the blobs have nothing to show.
    expect(colour('surface')).toEqual(colour('surface-solid'));
    for (const name of ['surface', 'surface-strong'])
      expect(colour(name)[3], `--qh-${name} alpha`).toBe(1);
    // The rating chart line is one colour. Hover, blobs, buttons and glow follow the preset: checked per variant below.
    expect(tokens.get('chart-line-start')).toBe('var(--qh-accent)');
  });

  it('draws a skeleton block that stands out from the card surface and from an inner tile', () => {
    const ground = colour('ground');
    const skeleton = over(colour('skeleton'), over(colour('surface-solid'), ground));
    for (const base of ['surface-solid', 'surface-strong'])
      expect(
        contrastRatio(skeleton, over(colour(base), ground)),
        `--qh-skeleton on --qh-${base}`,
      ).toBeGreaterThanOrEqual(1.1);
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

  it('keeps the impersonation banner text at 4.5:1 on its fill and the QR code at 7:1', () => {
    expect(
      contrastRatio(colour('on-caution-strong'), colour('caution-strong')),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colour('qr-ink'), colour('qr-paper'))).toBeGreaterThanOrEqual(7);
  });
});

describe.each(variants)('theme $theme with accent $accent', ({ theme, accent, tokens }) => {
  const label = `${theme}/${accent}`;
  const colour = colourOf(tokens, label);
  const flat = !entryOf(theme).glass;

  it.each(GLASS_LEVELS)(
    'keeps text at 4.5:1 on every ground at Glass %i, blobs at full glow',
    (glass) => {
      expect(contrastFailures(tokens, label, glass)).toEqual([]);
    },
  );

  it('keeps a flat theme flat whatever the preset: one-colour buttons, invisible glow, opaque hover, no blob', () => {
    if (!flat) return;
    const stops = [...(tokens.get('gradient-accent') ?? '').matchAll(/#[0-9a-f]{6}/gi)].map(
      ([stop]) => stop.toLowerCase(),
    );
    expect(stops).toHaveLength(2);
    expect(new Set([...stops, tokens.get('accent')!.toLowerCase()]).size).toBe(1);
    expect(tokens.get('glow')).toMatch(/rgba\(0, 0, 0, 0\)$/);
    expect(colour('surface-hover')[3], '--qh-surface-hover alpha').toBe(1);
    for (const blob of BLOBS) expect(colour(blob)[3], `--qh-${blob} alpha`).toBe(0);
  });

  it('keeps the first-solve fill a stronger green than the accepted tint (3:1), apart from wrong answer, with readable text', () => {
    const card = colour('surface-solid');
    const accepted = over(colour('verdict-ac-bg'), card);
    for (const fill of ['first-solve-bg', 'first-solve-bg-2'])
      expect(contrastRatio(colour(fill), accepted), fill).toBeGreaterThanOrEqual(3);
    const gap = Math.abs(
      hueOf(over(colour('first-solve-bg'), card)) - hueOf(over(colour('verdict-wa-bg'), card)),
    );
    expect(Math.min(gap, 360 - gap)).toBeGreaterThanOrEqual(30);
    for (const tint of ['first-solve-bg', 'first-solve-bg-2'])
      expect(
        contrastRatio(colour('first-solve-text'), over(colour(tint), card)),
      ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text on both accent fills at 4.5:1', () => {
    for (const fill of ['accent', 'accent-2'])
      expect(contrastRatio(colour('on-accent'), colour(fill))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the accent fills and the accent border at 3:1 on the ground and the opaque fallback', () => {
    const ground = colour('ground');
    const solid = over(colour('surface-solid'), ground);
    for (const token of ['accent', 'accent-2', 'line-accent'])
      for (const base of [ground, solid])
        expect(contrastRatio(colour(token), base), `${label} --qh-${token}`).toBeGreaterThanOrEqual(
          3,
        );
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

  it('keeps the problem list graphics (difficulty squares, empty status ring) at 3:1 on every row ground', () => {
    const MIN_GRAPHIC_CONTRAST = 3;
    const graphics = ['diff-1', 'diff-2', 'diff-3', 'diff-4', 'text-muted'];
    const failures = themes.flatMap(({ id, tokens }) => {
      const colour = colourOf(tokens, id);
      return ['surface-solid', 'surface-hover', 'surface-strong'].flatMap((ground) =>
        graphics
          .filter(
            (name) =>
              contrastRatio(colour(name), over(colour(ground), colour('ground'))) <
              MIN_GRAPHIC_CONTRAST,
          )
          .map((name) => `${id}: --qh-${name} on --qh-${ground}`),
      );
    });
    expect(failures).toEqual([]);
  });
});
