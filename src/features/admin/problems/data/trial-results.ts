import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import { caseVerdictOf } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';

/** What one test or one group got in a trial run. `time` is the test's own, or the slowest test of the group. */
export interface TrialResult {
  verdict: Verdict;
  time: number | null;
}

/**
 * A trial run as the test table reads it: a result per test number and per group number, in the numbering of the
 * table (tests count 1, 2, 3 across groups; groups count on their own, as the judge numbers them).
 */
export interface TrialResults {
  /** `none`: no run to show; `running`: the judge is on it; `finished`: it will not change. */
  phase: 'none' | 'running' | 'finished';
  /** The tests or the judging changed after the run: its results are shown in neutral ink and named as old. */
  isStale: boolean;
  tests: ReadonlyMap<number, TrialResult>;
  groups: ReadonlyMap<number, TrialResult>;
}

export const NO_TRIAL: TrialResults = {
  phase: 'none',
  isStale: false,
  tests: new Map(),
  groups: new Map(),
};

type TrialRun = Pick<SubmissionDetail, 'status' | 'cases' | 'batches'>;

export function trialResultsOf(run: TrialRun | undefined, isStale: boolean): TrialResults {
  if (!run) return NO_TRIAL;
  const cases = run.cases ?? [];
  const slowestIn = (group: number) => {
    const times = cases.filter((testCase) => testCase.batch === group).map(({ time }) => time);
    return times.length > 0 ? Math.max(...times) : null;
  };
  return {
    phase: IN_PROGRESS_STATUSES.includes(run.status) ? 'running' : 'finished',
    isStale,
    tests: new Map(
      cases.map((testCase) => [
        testCase.position,
        { verdict: caseVerdictOf(testCase), time: testCase.time },
      ]),
    ),
    groups: new Map(
      (run.batches ?? []).map((group) => [
        group.batch,
        { verdict: caseVerdictOf(group), time: slowestIn(group.batch) },
      ]),
    ),
  };
}
