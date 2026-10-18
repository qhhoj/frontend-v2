import type { BitMood } from './bit-moods';
import type { Verdict } from '@/lib/verdicts';

/** Wrong answer, the limits and runtime errors, and a compile error; system outcomes (IE, AB, SC, RJ) are not the author's miss. */
const REJECTED_TONES: Verdict['tone'][] = ['wa', 'tle', 'rte'];

/** The mood for a final verdict: a crown on a full AC only, a sweat drop on a rejected program, nobody otherwise (partially correct included). */
export function verdictBitMood(verdict: Verdict): BitMood | null {
  if (verdict.code === 'AC') return 'crown';
  if (REJECTED_TONES.includes(verdict.tone) || verdict.code === 'CE') return 'sweat';
  return null;
}
