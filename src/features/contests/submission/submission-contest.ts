import type {
  ContestDetail,
  ContestFormatName,
  ContestProblem,
  ParticipationSummary,
} from '@/api/types/contests';
import { pythonRound } from '@/lib/python-round';

/** What the result page needs from a submission's contest (P-14 B). */
export interface SubmissionInContest {
  contest: Pick<ContestDetail, 'key' | 'name' | 'pointsPrecision' | 'formatName'>;
  problem: ContestProblem;
  /** The contest's next problem after this one, or null on the last. */
  next: ContestProblem | null;
  /** Whole minutes from the start of the viewer's run to the submission. */
  minute: number;
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

/**
 * The contest points of a judged submission, as the backend stores them (`contestSubmissionPoints`): the case ratio of
 * the contest problem's points, rounded to 3 places as Python does; a non-partial problem scores 0 unless full. final_submission
 * always counts partial points.
 */
export function contestPointsOf(
  totals: { casePoints: number; caseTotal: number },
  contestProblem: Pick<ContestProblem, 'points' | 'partial'>,
  formatName: ContestFormatName,
  isProblemPartial: boolean,
): number {
  const ratio = totals.caseTotal > 0 ? totals.casePoints / totals.caseTotal : 0;
  const points = pythonRound(ratio * contestProblem.points, 3);
  const isPartial =
    formatName === 'final_submission' || (contestProblem.partial && isProblemPartial);
  return isPartial || points === contestProblem.points ? points : 0;
}
