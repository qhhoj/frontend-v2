import type { ContestListItem, CurrentParticipation } from '@/api/types/contests';
import { phaseAt } from '@/lib/contest-time';

/**
 * What the home's plate shows, in this order: the run the viewer is in (`contest` is its list row, null for a virtual
 * run of an ended contest), else a contest that is running, else the next one to start, else nothing.
 */
export type HomePlate =
  | { kind: 'mine'; current: CurrentParticipation; contest: ContestListItem | null }
  | { kind: 'running' | 'upcoming'; contest: ContestListItem }
  | { kind: 'none' };

/** The clock decides when a contest is over or has started, not the list's `phase` field: a list read before that is stale. */
export function homePlate(
  current: CurrentParticipation | null,
  running: readonly ContestListItem[],
  upcoming: readonly ContestListItem[],
  now: number,
): HomePlate {
  if (current) {
    const contest = running.find((item) => item.key === current.contest.key) ?? null;
    return { kind: 'mine', current, contest };
  }
  // A row of the running list counts until its end: at the second a contest starts, the caller's clock may still be before it.
  const live = running.find((item) => phaseAt(item, now) !== 'ended');
  if (live) return { kind: 'running', contest: live };
  const next = upcoming
    .filter((item) => phaseAt(item, now) === 'upcoming')
    .sort((left, right) => Date.parse(left.startTime) - Date.parse(right.startTime))[0];
  return next ? { kind: 'upcoming', contest: next } : { kind: 'none' };
}

/** The key of the contest on the plate, so the contest list under it leaves that contest out. */
export function plateKeyOf(plate: HomePlate): string | null {
  if (plate.kind === 'none') return null;
  return plate.kind === 'mine' ? plate.current.contest.key : plate.contest.key;
}
