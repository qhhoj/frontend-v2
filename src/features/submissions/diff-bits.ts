import type { BitMood } from '@/mascot/bit-moods';
import type { BitKind } from '@/mascot/bit-frames';
import type { StateKind } from '@/mascot/state-bits';

/** The one place the diff page picks a Bit: each page-sized outcome is a `StatePanel` kind (drawn through STATE_BITS). */
export const DIFF_STATE_PANELS = {
  pick: 'empty',
  forbidden: 'forbidden',
  notFound: 'notFound',
  error: 'error',
  tooLong: 'error',
  tooDifferent: 'error',
  identical: 'success',
} as const satisfies Record<string, StateKind>;

/** Decorative small Bits beside the diff notices and entry points (`InlineBit`). */
export const DIFF_INLINE_BITS = {
  languages: 'sweat',
  compareForm: 'writing',
  pickedTwo: 'crown',
} as const satisfies Record<string, BitMood | BitKind>;
