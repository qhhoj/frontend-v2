import type { BitMood } from '@/mascot/bit-moods';

/** The one place the short-link button picks its small decorative Bits. */
export const SHORT_LINK_BITS = {
  limited: 'sweat',
  manual: 'sweat',
  problem: 'sweat',
} as const satisfies Record<string, BitMood>;
