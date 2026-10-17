import type { SubmissionCase } from '@/api/types/submissions';

/** Statuses that are not a failure: passed, or skipped after an earlier failure of the subtask. */
const NOT_FAILED: ReadonlySet<SubmissionCase['status']> = new Set(['AC', 'SC']);

/**
 * The test the result strip names after the verdict ("WA test 3"): the first failing test by position, or null when every
 * test passed or the viewer may not see the tests.
 */
export function firstFailedTest(cases: readonly SubmissionCase[] | null): number | null {
  const failed = (cases ?? [])
    .filter((testCase) => !NOT_FAILED.has(testCase.status))
    .map((testCase) => testCase.position);
  return failed.length ? Math.min(...failed) : null;
}
