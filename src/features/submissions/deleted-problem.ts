import type { BitMood } from '@/mascot/bit-moods';

/** REPLACEABLE HOOK: the Bit of the deleted-problem tombstone (plan VNOI F4): asleep, the problem is gone for good. */
export const DELETED_PROBLEM_BIT = 'asleep' as const satisfies BitMood;

/** The server keeps a deleted or purged problem's submissions and flags their problem (`isDeleted`). */
export const isProblemDeleted = (
  row: { problem: { isDeleted: boolean } | null } | null | undefined,
): boolean => row?.problem?.isDeleted === true;
