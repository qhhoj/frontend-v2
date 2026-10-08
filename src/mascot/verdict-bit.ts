import { PLACEMENT_LOOKS } from './bit-sprite';
import type { BitLook } from './bit-sprite';
import type { Verdict } from '@/lib/verdicts';

/** Wrong answer, the limits and runtime errors, and a compile error; system outcomes (IE, AB, SC, RJ) are not the author's miss. */
const REJECTED_TONES: Verdict['tone'][] = ['wa', 'tle', 'rte'];

/** Bit for a final verdict: a crown on AC, a sweat drop on a rejected program, nobody otherwise. */
export function verdictBitLook(verdict: Verdict): BitLook | null {
  if (verdict.code === 'AC') return PLACEMENT_LOOKS.accepted;
  if (REJECTED_TONES.includes(verdict.tone) || verdict.code === 'CE')
    return PLACEMENT_LOOKS.rejected;
  return null;
}
