import type { CueTone } from './cue-tones';

/**
 * A row whose whole meaning is one cue (a solved problem, a running contest): the cue's light tint over the row and a 3 px edge
 * in the cue's colour on its left. Whole class names, so Tailwind finds them. A row with no state stays plain.
 */
export const CUE_ROW: Record<CueTone, string> = {
  live: 'border-l-3 border-l-cue-live bg-cue-live-bg',
  upcoming: 'border-l-3 border-l-cue-upcoming bg-cue-upcoming-bg',
  ended: 'border-l-3 border-l-cue-ended',
  full: 'border-l-3 border-l-cue-full bg-cue-full-bg',
  partial: 'border-l-3 border-l-cue-partial bg-cue-partial-bg',
  zero: 'border-l-3 border-l-cue-zero bg-cue-zero-bg',
  attention: 'border-l-3 border-l-cue-attention bg-cue-attention-bg',
};
