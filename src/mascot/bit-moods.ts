import { PLACEMENT_LOOKS } from './bit-sprite';
import type { BitLook } from './bit-sprite';

export interface BitMoodSpec {
  look: BitLook;
  /** Eyes shut for the whole placement (the blink does not open them). */
  eyesShut: boolean;
  /** i18n key of the alt text, used where Bit is an image rather than decoration. */
  labelKey: string;
}

/** The moods Bit shows beside a notice or a verdict. InlineBit and SubmissionSummary both read this one table. */
export const BIT_MOODS = {
  crown: { look: PLACEMENT_LOOKS.accepted, eyesShut: false, labelKey: 'bit.accepted' },
  sweat: { look: PLACEMENT_LOOKS.rejected, eyesShut: true, labelKey: 'bit.rejected' },
  asleep: { look: PLACEMENT_LOOKS.emptyList, eyesShut: true, labelKey: 'bit.asleep' },
} as const satisfies Record<string, BitMoodSpec>;

export type BitMood = keyof typeof BIT_MOODS;
