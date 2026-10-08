import { ApiError } from '@/api/client';
import type { VoteScore } from '@/api/types/votes';
import { errorMessageKey } from '@/i18n/error-message';

/** Pressing the arrow already pressed withdraws the vote (0). */
export const nextVote = (current: VoteScore, pressed: 1 | -1): VoteScore =>
  current === pressed ? 0 : pressed;

/** The score once a vote of `from` is replaced by `to`: one vote each way is worth one point. */
export const scoreAfterVote = (score: number, from: VoteScore, to: VoteScore) => score - from + to;

/** 403 is the interaction gate or one's own text (E13), 429 the vote rate; anything else by its error code. */
export function voteRefusalKey(error: unknown): string {
  if (error instanceof ApiError && error.code === 'forbidden') return 'vote.refusedGate';
  if (error instanceof ApiError && error.code === 'rate_limited') return 'vote.refusedRate';
  return errorMessageKey(error);
}
