/**
 * The seven cues (DESIGN.md colour cue map): one meaning each, the same on every page. Chip and StatusDot take them as `tone`.
 * A verdict's own parts stay verdict-*; everything else that says one of these uses the cue.
 */
export type CueTone = 'live' | 'upcoming' | 'ended' | 'full' | 'partial' | 'zero' | 'attention';

export const CUE_TONES: readonly CueTone[] = [
  'live',
  'upcoming',
  'ended',
  'full',
  'partial',
  'zero',
  'attention',
];

/** Whole class names, so Tailwind finds them. */
export const CUE_TEXT: Record<CueTone, string> = {
  live: 'text-cue-live',
  upcoming: 'text-cue-upcoming',
  ended: 'text-cue-ended',
  full: 'text-cue-full',
  partial: 'text-cue-partial',
  zero: 'text-cue-zero',
  attention: 'text-cue-attention',
};

/** @deprecated The tinted chip look; `Chip` draws one ground for every tone now. Kept for old imports. */
export const CUE_CHIP: Record<CueTone, string> = {
  live: 'bg-cue-live-bg text-cue-live',
  upcoming: 'bg-cue-upcoming-bg text-cue-upcoming',
  ended: 'bg-cue-ended-bg text-cue-ended',
  full: 'bg-cue-full-bg text-cue-full',
  partial: 'bg-cue-partial-bg text-cue-partial',
  zero: 'bg-cue-zero-bg text-cue-zero',
  attention: 'bg-cue-attention-bg text-cue-attention',
};

export const CUE_DOT: Record<CueTone, string> = {
  live: 'bg-cue-live',
  upcoming: 'bg-cue-upcoming',
  ended: 'bg-cue-ended',
  full: 'bg-cue-full',
  partial: 'bg-cue-partial',
  zero: 'bg-cue-zero',
  attention: 'bg-cue-attention',
};

/** A row whose whole meaning is a state: the light tint and a 3 px left edge (a list item or a card). */
export const CUE_ROW: Record<CueTone, string> = {
  live: 'bg-cue-live-bg border-l-3 border-l-cue-live',
  upcoming: 'bg-cue-upcoming-bg border-l-3 border-l-cue-upcoming',
  ended: 'bg-cue-ended-bg border-l-3 border-l-cue-ended',
  full: 'bg-cue-full-bg border-l-3 border-l-cue-full',
  partial: 'bg-cue-partial-bg border-l-3 border-l-cue-partial',
  zero: 'bg-cue-zero-bg border-l-3 border-l-cue-zero',
  attention: 'bg-cue-attention-bg border-l-3 border-l-cue-attention',
};

/** The same for a table row: the tint on the row, the edge on its first cell (a row has no border of its own). */
export const CUE_TABLE_ROW: Record<CueTone, string> = {
  live: 'bg-cue-live-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-live',
  upcoming: 'bg-cue-upcoming-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-upcoming',
  ended: 'bg-cue-ended-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-ended',
  full: 'bg-cue-full-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-full',
  partial: 'bg-cue-partial-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-partial',
  zero: 'bg-cue-zero-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-zero',
  attention:
    'bg-cue-attention-bg [&>:first-child]:border-l-3 [&>:first-child]:border-l-cue-attention',
};
