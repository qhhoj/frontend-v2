import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail, SubmissionStatus } from '@/api/types/submissions';

export type StaffActionState = 'ready' | 'waiting' | 'locked' | 'hidden';
export interface StaffActions {
  rejudge: StaffActionState;
  reject: StaffActionState;
  abort: StaffActionState;
}
type Can = (permission: string) => boolean;

/** The three permissions that open the staff panel at all. */
export const STAFF_PERMISSIONS = [
  'judge.rejudge_submission',
  'judge.reject_submission',
  'judge.abort_any_submission',
] as const;

/** Still being judged, or waiting for the contest's final judging (`PD`): rejudge and reject answer 409 until it is over. */
const UNFINISHED: readonly SubmissionStatus[] = [...IN_PROGRESS_STATUSES, 'PD'];
export const isUnfinished = (submission: SubmissionDetail) =>
  UNFINISHED.includes(submission.status);
const hasPassed = (iso: string | null, now: number) =>
  iso !== null && new Date(iso).getTime() <= now;

/** `ready` is the server's flag; a refused flag is `waiting` only where the board draws a wait and the account holds the permission. */
const stateOf = (
  isAllowed: boolean,
  hasPermission: boolean,
  isWaiting: boolean,
): StaffActionState => {
  if (isAllowed) return 'ready';
  return hasPermission && isWaiting ? 'waiting' : 'hidden';
};

function rejudgeState(submission: SubmissionDetail, can: Can, now: number): StaffActionState {
  const hasPermission = can('judge.rejudge_submission');
  if (
    !submission.viewer.canRejudge &&
    hasPermission &&
    !isUnfinished(submission) &&
    hasPassed(submission.lockedAfter, now)
  )
    return 'locked';
  return stateOf(submission.viewer.canRejudge, hasPermission, isUnfinished(submission));
}

/** R2 from the server's `viewer.can*` flags (they already hold the permission, edit-rights, lock and status rules) plus the permission list for the waiting looks the board draws. */
export function staffActionsFor(submission: SubmissionDetail, can: Can, now: number): StaffActions {
  const { canAbort, canReject } = submission.viewer;
  return {
    rejudge: rejudgeState(submission, can, now),
    reject: stateOf(canReject, can('judge.reject_submission'), isUnfinished(submission)),
    abort: stateOf(canAbort, can('judge.abort_any_submission'), !isUnfinished(submission)),
  };
}

export const hasAnyStaffAction = (actions: StaffActions) =>
  Object.values(actions).some((state) => state !== 'hidden');

/** Holding one of the staff permissions is what opens the panel: an owner without one never sees it, whatever the abort flag says. */
export const holdsAnyStaffPermission = (can: Can) =>
  STAFF_PERMISSIONS.some((permission) => can(permission));

/** The board's line: "bị khóa từ 18:00 · 08/10" once passed, "khóa lúc …" while still ahead; null when the submission never locks. */
export function lockLineOf(
  submission: SubmissionDetail,
  now: number,
): { key: 'since' | 'at'; time: string } | null {
  if (submission.lockedAfter === null) return null;
  return {
    key: hasPassed(submission.lockedAfter, now) ? 'since' : 'at',
    time: submission.lockedAfter,
  };
}
