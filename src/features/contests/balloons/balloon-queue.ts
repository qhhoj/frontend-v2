import { ApiError } from '@/api/client';
import type { Balloon, BalloonRef, BalloonState } from '@/api/types/contest-ops';
import { formatElapsedSeconds } from '@/lib/format';
import { errorMessageKey } from '@/i18n/error-message';
import { NEUTRAL_TAG_CLASS, TAG_COLOR_CLASSES, tagColorAt } from '../tag-colors';

const CONFLICT_STATUS = 409;

export const BALLOON_STATES: readonly BalloonState[] = ['pending', 'delivered', 'all'];

export const balloonStateOf = (value: unknown): BalloonState =>
  BALLOON_STATES.includes(value as BalloonState) ? (value as BalloonState) : 'pending';

const LETTERS = /^[A-Z]+$/;
const DIGITS = /^\d+$/;
const ALPHABET = 26;
const CODE_A = 'A'.charCodeAt(0);

/** The 0-based position a label names: `A`=0 to `Z`=25, `AA`=26 (alpha labels), `1`=0 (numeric labels); null for anything else. */
export function labelIndex(label: string): number | null {
  if (DIGITS.test(label)) return Number(label) - 1;
  if (!LETTERS.test(label)) return null;
  return (
    [...label].reduce((total, letter) => total * ALPHABET + letter.charCodeAt(0) - CODE_A + 1, 0) -
    1
  );
}

/** The problem's swatch: the tag colours by label position, so a runner matches the balloon colour across screens. */
export function swatchClassOf(label: string): string {
  const index = labelIndex(label);
  return index === null ? NEUTRAL_TAG_CLASS : TAG_COLOR_CLASSES[tagColorAt(index)];
}

/** Seconds from the team's start as `H:MM:SS`; null while the board is frozen for a volunteer. */
export const solvedAtText = (seconds: number | null): string =>
  seconds === null ? '—' : formatElapsedSeconds(seconds);

export const isDelivered = (balloon: Balloon): boolean => balloon.deliveredAt !== null;
export const balloonRowId = (balloon: BalloonRef): string =>
  `${balloon.participationId}:${balloon.problemId}`;

const DELIVERY_CONFLICTS = ['already_delivered', 'not_delivered'];

/** The `errors.*` text of a refused write: a 409 `conflict` is told apart by its issue code, not its English message. */
export function deliveryFailureKey(error: unknown): string {
  if (error instanceof ApiError && error.status === CONFLICT_STATUS) {
    const issueCode = error.issues.find((issue) => DELIVERY_CONFLICTS.includes(issue.code))?.code;
    if (issueCode) return `errors.${issueCode}`;
  }
  return errorMessageKey(error);
}

/** The wait a 429 names in its `Retry-After`, in whole seconds; null for any other failure. */
export const retryAfterOf = (error: unknown): number | null =>
  error instanceof ApiError ? error.retryAfterSeconds : null;
