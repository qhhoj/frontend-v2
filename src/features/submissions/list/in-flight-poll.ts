import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionListItem } from '@/api/types/submissions';

/** Waits between page reads while rows are judged: back off while nothing moves, back to the first when something does. */
export const POLL_DELAYS_MS = [3_000, 5_000, 10_000] as const;
/** A row stops being a reason to poll this long after the list first showed it in flight. */
export const ROW_POLL_LIMIT_MS = 120_000;

const isInFlight = (row: SubmissionListItem) => IN_PROGRESS_STATUSES.includes(row.status);

/** Rows worth a poll: being judged, with a strip this viewer sees, first seen in flight under `ROW_POLL_LIMIT_MS` ago. */
export function pollableIds(
  rows: readonly SubmissionListItem[],
  firstSeen: ReadonlyMap<string, number>,
  now: number,
): string[] {
  return rows
    .filter((row) => isInFlight(row) && row.testSummary)
    .filter((row) => now - (firstSeen.get(row.id) ?? now) < ROW_POLL_LIMIT_MS)
    .map((row) => row.id);
}

/** What a poll compares to tell whether judging moved: status and judged count of the given rows. */
export function progressKey(rows: readonly SubmissionListItem[], ids: readonly string[]): string {
  return rows
    .filter((row) => ids.includes(row.id))
    .map(
      (row) =>
        `${row.id}:${row.status}:${(row.testSummary?.statuses.length ?? 0) + (row.testSummary?.more ?? 0)}`,
    )
    .join('|');
}

/** The next wait's index in `POLL_DELAYS_MS`. */
export const nextDelayIndex = (index: number, hasMoved: boolean): number =>
  hasMoved ? 0 : Math.min(index + 1, POLL_DELAYS_MS.length - 1);
