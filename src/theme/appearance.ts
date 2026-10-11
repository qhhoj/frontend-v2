/**
 * A visitor's own look: an accent preset plus two levels. Style and mode (Clay or Glass; light, dark or auto) are not
 * part of it: they stay the theme preference (`siteTheme` on the account). The backend stores the same shape
 * (`appearance`, backend Task 20). Add a preset: its id here, a block in every theme file (`themes.node.spec.ts` enforces
 * it), the label in both locales, the id in the pre-paint script's `accents`, and in the backend's `APPEARANCE_ACCENTS`.
 */
export const ACCENTS = [
  { id: 'clay', labelKey: 'appearance.accent.clay' },
  { id: 'orchid', labelKey: 'appearance.accent.orchid' },
  { id: 'ocean', labelKey: 'appearance.accent.ocean' },
  { id: 'mint', labelKey: 'appearance.accent.mint' },
  { id: 'sunset', labelKey: 'appearance.accent.sunset' },
  { id: 'gold', labelKey: 'appearance.accent.gold' },
  { id: 'mono', labelKey: 'appearance.accent.mono' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];

export interface Appearance {
  accent: AccentId;
  /** 0 Clear (the theme's own glass) to 100 Solid (opaque, no blur). */
  glass: number;
  /** 0 to 100: how strong the background blobs are; 100 is the site's blobs. */
  glow: number;
}

/**
 * A theme as designed, given its own preset (`ThemeDefinition.accent`): Clear glass and the site's blobs. Turning the
 * look on starts here, so it changes nothing on any theme until a control moves.
 */
export const siteLook = (accent: AccentId): Appearance => ({ accent, glass: 0, glow: 100 });

export const GLASS_STOPS = [
  { value: 0, labelKey: 'appearance.glassStop.clear' },
  { value: 50, labelKey: 'appearance.glassStop.frosted' },
  { value: 100, labelKey: 'appearance.glassStop.solid' },
] as const;

const isPercent = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;

/** Stored JSON and backend values are untrusted: anything but a complete valid look is "no look". */
export function parseAppearance(value: unknown): Appearance | null {
  if (typeof value !== 'object' || value === null) return null;
  const { accent, glass, glow } = value as Record<string, unknown>;
  const preset = ACCENTS.find((candidate) => candidate.id === accent);
  return preset && isPercent(glass) && isPercent(glow) ? { accent: preset.id, glass, glow } : null;
}

/** Expects a glass value from a parsed look (an integer 0-100). */
export const nearestGlassStop = (glass: number): 0 | 50 | 100 =>
  (Math.round(glass / 50) * 50) as 0 | 50 | 100;

/** What goes on `<html>`: the `data-accent` value, `--qh-glass-level` and `--qh-blob-strength`. The pre-paint script in index.html does the same. */
export const appearanceVariables = (look: Appearance) => ({
  accent: look.accent,
  glass: String(look.glass),
  blobStrength: String(look.glow / 100),
});
