import type { ContestFormatName } from '@/api/types/contests';
import { isBoardFrozen } from '@/lib/board-freeze';

/** The contest fields whose change makes the backend rescore every participation (`scoringOf` in the editing service). */
const SCORING_FIELDS = [
  'formatName',
  'formatConfig',
  'startTime',
  'endTime',
  'frozenLastMinutes',
  'pointsPrecision',
  'problems',
] as const;

/** Whether saving this PATCH queues a full contest rescore. */
export const rescoresOn = (patch: object): boolean =>
  SCORING_FIELDS.some((field) => field in patch);

export type FreezeState =
  | { kind: 'unsupported' }
  | { kind: 'off' }
  | { kind: 'scheduled'; at: Date }
  | { kind: 'frozen'; since: Date };

/**
 * The ranking freeze as a state (mirrors backend `frozenTime`): a format that never freezes, no window set, due at a time,
 * or on now. A freeze outlives the end of the contest until the window is set to 0.
 */
export function freezeStateOf(
  contest: {
    formatName: ContestFormatName;
    endTime: string;
    frozenLastMinutes: number;
  },
  now: number,
): FreezeState {
  if (!isBoardFrozen({ ...contest, frozenLastMinutes: 1 })) return { kind: 'unsupported' };
  if (contest.frozenLastMinutes <= 0) return { kind: 'off' };
  const at = new Date(Date.parse(contest.endTime) - contest.frozenLastMinutes * 60_000);
  return now >= at.getTime() ? { kind: 'frozen', since: at } : { kind: 'scheduled', at };
}

/** Lock state: submissions after `lockedAfter` are not rejudged. */
export const isLockedNow = (lockedAfter: string | null, now: number): boolean =>
  lockedAfter !== null && Date.parse(lockedAfter) <= now;
