import type { ContestFormatName } from '@/api/types/contests';

/** Mirrors backend `FREEZE_FORMATS` (libs/contests contest-time): only these formats freeze their board. */
const FREEZE_FORMATS: readonly ContestFormatName[] = ['icpc', 'vnoj'];

/**
 * Mirrors backend `frozenTime`/`isFrozen`: a board is frozen only in a freezing format with a freeze window set. The freeze
 * outlives the end until an editor sets the window to 0, so rating and the replay stay refused until then.
 */
export const isBoardFrozen = (contest: {
  formatName: ContestFormatName;
  frozenLastMinutes: number;
}): boolean => FREEZE_FORMATS.includes(contest.formatName) && contest.frozenLastMinutes > 0;
