/**
 * A visitor's own look: an accent, a contrast level and a page background. Mode (light, dark or auto) is not part of
 * it: it stays the theme preference (`siteTheme` on the account). The backend stores the same shape (`appearance`).
 * Add an accent: its id here and in `scripts/palette/paper.mjs` (`npm run palette` writes its rules in every palette), the label in both
 * locales, the id in the pre-paint script's `accents`, and in the backend's `APPEARANCE_ACCENTS`.
 * Add a background: its id in `BACKGROUNDS`, a block in `backgrounds.css`, the label in both locales, the id in the
 * pre-paint script's `backgrounds`, and in the backend's `APPEARANCE_BACKGROUNDS`.
 */
export const ACCENTS = [
  { id: 'ultramarine', labelKey: 'appearance.accent.ultramarine' },
  { id: 'teal', labelKey: 'appearance.accent.teal' },
  { id: 'plum', labelKey: 'appearance.accent.plum' },
  { id: 'terracotta', labelKey: 'appearance.accent.terracotta' },
  { id: 'graphite', labelKey: 'appearance.accent.graphite' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];

/** The site's accent (Catppuccin's mauve): what everyone without a look of their own sees in the default palette. Another palette names its own (`defaultAccentOf`). */
export const DEFAULT_ACCENT: AccentId = 'plum';

/**
 * The eight accents of Clay and Glass, and the accent each one became (palette A, 2026-11-15): looks saved before are
 * read through this. The pre-paint script's `legacyAccents` must match (prepaint.spec.ts enforces it).
 */
export const LEGACY_ACCENTS: Readonly<Record<string, AccentId>> = {
  clay: 'terracotta',
  orchid: 'plum',
  ocean: 'ultramarine',
  mint: 'teal',
  sunset: 'terracotta',
  gold: 'terracotta',
  mono: 'graphite',
  red: 'terracotta',
};

/** Standard, or the high-contrast overlay (`data-contrast="high"`, every palette's file in src/theme/palette/). */
export const CONTRASTS = [
  { id: 'standard', labelKey: 'appearance.contrastOption.standard' },
  { id: 'high', labelKey: 'appearance.contrastOption.high' },
] as const;

export type ContrastId = (typeof CONTRASTS)[number]['id'];

/** The device asks for more contrast: without a look of their own, a visitor gets the high level. */
export const MORE_CONTRAST_QUERY = '(prefers-contrast: more)';

/** Page backgrounds, in picker order (`backgrounds.css` draws them). */
export const BACKGROUNDS = [
  { id: 'none', labelKey: 'appearance.background.none' },
  { id: 'paper', labelKey: 'appearance.background.paper' },
  { id: 'grainy', labelKey: 'appearance.background.grainy' },
  { id: 'contour', labelKey: 'appearance.background.contour' },
  { id: 'halftone', labelKey: 'appearance.background.halftone' },
  { id: 'dither', labelKey: 'appearance.background.dither' },
  { id: 'stipple', labelKey: 'appearance.background.stipple' },
  { id: 'landscape', labelKey: 'appearance.background.landscape' },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]['id'];

/** What everyone has until they choose: signed out, signed in, with or without a personal look. */
export const DEFAULT_BACKGROUND: BackgroundId = 'none';

export interface Appearance {
  accent: AccentId;
  contrast: ContrastId;
  background: BackgroundId;
}

/** The site's own look, at the contrast level the device asks for and the palette's default accent. Choosing anything starts from it. */
export const siteLook = (
  contrast: ContrastId = 'standard',
  accent: AccentId = DEFAULT_ACCENT,
): Appearance => ({
  accent,
  contrast,
  background: DEFAULT_BACKGROUND,
});

/** A current accent id, a retired one mapped to its successor, or `null`. */
export function parseAccent(value: unknown): AccentId | null {
  const id =
    typeof value === 'string' && Object.hasOwn(LEGACY_ACCENTS, value)
      ? LEGACY_ACCENTS[value]
      : value;
  return ACCENTS.find((candidate) => candidate.id === id)?.id ?? null;
}

/** A missing or unknown background is the default: looks saved before backgrounds existed gain it, and a retired id degrades gracefully. */
export const parseBackground = (value: unknown): BackgroundId =>
  BACKGROUNDS.find((candidate) => candidate.id === value)?.id ?? DEFAULT_BACKGROUND;

/**
 * Stored JSON and backend values are untrusted: no accent, or an unknown one, is "no look". Contrast and background
 * fall back to their defaults; the Glass-era `glass` and `glow` levels are ignored.
 */
export function parseAppearance(value: unknown): Appearance | null {
  if (typeof value !== 'object' || value === null) return null;
  const { accent, contrast, background } = value as Record<string, unknown>;
  const preset = parseAccent(accent);
  return preset
    ? {
        accent: preset,
        contrast: contrast === 'high' ? 'high' : 'standard',
        background: parseBackground(background),
      }
    : null;
}

/** True for a stored look whose accent was retired with Clay and Glass. */
export const hasLegacyAccent = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  Object.hasOwn(LEGACY_ACCENTS, String((value as Record<string, unknown>).accent));

/** The backend stores a look without the defaults (`contrast` standard, `background` none): they are never sent. */
export const toWireAppearance = (look: Appearance | null) =>
  look && {
    accent: look.accent,
    ...(look.contrast !== 'standard' && { contrast: look.contrast }),
    ...(look.background !== DEFAULT_BACKGROUND && { background: look.background }),
  };
