import { PALETTE_SWATCHES } from './palette/swatches';
import type { PaletteSwatch } from './palette/swatches';
import { ACCENTS, DEFAULT_ACCENT } from './appearance';
import type { AccentId } from './appearance';

/**
 * A palette is the page's grounds, text, cues, tags and accents: one CSS file each in `palette/`, generated from
 * `scripts/palette/palettes.mjs` (`npm run palette`). The visitor's choice stays in this browser (`qhhoj.palette`): the
 * backend's `appearance` (accent, contrast, background) does not carry it. Add a palette: its inputs in `palettes.mjs`
 * and its label in both locales (`appearance.palette.<id>`).
 */
export type PaletteId = (typeof PALETTE_SWATCHES)[number]['id'];

export const PALETTES = PALETTE_SWATCHES;

/** The site's palette, the first in `palettes.mjs`: its CSS is in the main stylesheet and needs no `data-palette`. */
export const DEFAULT_PALETTE: PaletteId = PALETTES[0].id;

export const PALETTE_STORAGE_KEY = 'qhhoj.palette';

export const paletteLabelKey = (id: PaletteId) => `appearance.palette.${id}`;

/** A stored value is untrusted: an unknown or retired id is "no choice". */
export const parsePalette = (value: unknown): PaletteId | null =>
  PALETTES.find((palette) => palette.id === value)?.id ?? null;

/** The accent a visitor without a look of their own sees in this palette. */
export const defaultAccentOf = (id: PaletteId): AccentId => {
  const accent = PALETTES.find((palette) => palette.id === id)?.defaultAccent;
  return ACCENTS.find((candidate) => candidate.id === accent)?.id ?? DEFAULT_ACCENT;
};

export const swatchOf = (id: PaletteId, scheme: 'light' | 'dark'): PaletteSwatch =>
  (PALETTES.find((palette) => palette.id === id) ?? PALETTES[0])[scheme];
