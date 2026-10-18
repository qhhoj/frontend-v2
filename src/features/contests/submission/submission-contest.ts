import type { ContestDetail, ContestProblem, ParticipationSummary } from '@/api/types/contests';

/** What the result page shows of a submission's contest (P-14 B). */
export interface SubmissionInContest {
  contest: Pick<ContestDetail, 'key' | 'name' | 'pointsPrecision'>;
  problem: ContestProblem;
  /** Its contest points (the API's, as the scoreboard counts them); null when the contest holds none. */
  points: number | null;
  /** In the viewer's running run only: the contest's next problem, null on the last. */
  next: ContestProblem | null;
  /** The API's run minute (the submitter's own submission within its run); null otherwise. */
  minute: number | null;
}

/** The submission was made during this run (live or virtual): from its start up to its end. */
export const isDuringRun = (
  date: string,
  run: Pick<ParticipationSummary, 'realStart' | 'endTime'>,
): boolean => {
  const at = Date.parse(date);
  return at >= Date.parse(run.realStart) && at <= Date.parse(run.endTime);
};

/** The problem after `code` in the contest's order; null for the last one or a problem not in the contest. */
export function nextProblem(
  problems: readonly ContestProblem[],
  code: string,
): ContestProblem | null {
  const index = problems.findIndex((problem) => problem.code === code);
  return index === -1 ? null : (problems[index + 1] ?? null);
}
