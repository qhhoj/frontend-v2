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

/** Text on a tint with a border: the chip look. */
export const CUE_CHIP: Record<CueTone, string> = {
  live: 'border-cue-live-border bg-cue-live-bg text-cue-live',
  upcoming: 'border-cue-upcoming-border bg-cue-upcoming-bg text-cue-upcoming',
  ended: 'border-cue-ended-border bg-cue-ended-bg text-cue-ended',
  full: 'border-cue-full-border bg-cue-full-bg text-cue-full',
  partial: 'border-cue-partial-border bg-cue-partial-bg text-cue-partial',
  zero: 'border-cue-zero-border bg-cue-zero-bg text-cue-zero',
  attention: 'border-cue-attention-border bg-cue-attention-bg text-cue-attention',
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
