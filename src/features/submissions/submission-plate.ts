import type { SubmissionCase, SubmissionDetail } from '@/api/types/submissions';
import type { ProblemDetail } from '@/api/types/problems';
import type { TestSquare } from '@/components/ui/TestSquares.vue';
import { translate, type Locale } from '@/i18n';
import { caseVerdictOf, verdictOfCode } from '@/lib/verdicts';
import { caseTitle, isFailed, isFullCase, pendingPositions } from './test-overview';

/** Past this many tests a submission with subtasks shows one square per subtask, so the plate stays readable. */
export const GROUP_SQUARES_ABOVE = 60;
/** Up to this many squares sit in the plate's row; more take a row of their own under it and wrap there. */
export const INLINE_SQUARES_MAX = 20;

type PlateSource = Pick<SubmissionDetail, 'cases' | 'batches' | 'totalCases' | 'testSummary'>;

/** The squares of the plate and what one square stands for. */
export interface PlateSquares {
  unit: 'test' | 'group';
  squares: TestSquare[];
}

const waitingSquare = (number: number): TestSquare => ({
  tone: 'waiting',
  number,
  label: translate('submission.plate.waitingTest', { number }),
});
const groupSquare = (
  number: number,
  status: SubmissionCase['status'],
  points?: { points: number; total: number },
): TestSquare => {
  const verdict = points ? caseVerdictOf({ status, ...points }) : verdictOfCode(status);
  return {
    tone: verdict.tone,
    number,
    label: translate('submission.plate.groupTitle', {
      number,
      verdict: translate(verdict.labelKey),
    }),
  };
};

/**
 * One square per test in judging order, with the tests the judge has not reached yet as waiting squares while it runs.
 * A submission with subtasks and very many tests shows one square per subtask instead. A viewer who may not see the
 * test results gets the subtasks, or the row's summary; null when the API gives none of them.
 */
export function plateSquares(
  row: PlateSource,
  running: boolean,
  locale: Locale,
): PlateSquares | null {
  const { cases, batches, totalCases, testSummary } = row;
  const hasGroups = batches !== null && batches.length > 0;
  const isGrouped = hasGroups && (cases === null || cases.length > GROUP_SQUARES_ABOVE);
  if (cases && !isGrouped) {
    const squares = [
      ...cases.map((testCase) => ({
        tone: caseVerdictOf(testCase).tone,
        number: testCase.position,
        label: caseTitle(testCase, locale),
      })),
      ...pendingPositions(cases, totalCases, running).map(waitingSquare),
    ];
    return squares.length > 0 ? { unit: 'test', squares } : null;
  }
  if (hasGroups)
    return {
      unit: 'group',
      squares: batches.map((batch) => groupSquare(batch.batch, batch.status, batch)),
    };
  if (!testSummary || testSummary.statuses.length === 0) return null;
  const isGroups = testSummary.unit === 'batch';
  return {
    unit: isGroups ? 'group' : 'test',
    squares: testSummary.statuses.map((status, index) => {
      const number = isGroups ? (testSummary.batches[index] ?? index + 1) : index + 1;
      if (isGroups) return groupSquare(number, status);
      const verdict = verdictOfCode(status);
      return {
        tone: verdict.tone,
        number,
        label: translate('submission.plate.testTitle', {
          number,
          verdict: translate(verdict.labelKey),
        }),
      };
    }),
  };
}

/** The first test that failed, when the viewer sees the tests: the verdict sentence names it by its own status. */
export const firstFailedCase = (cases: SubmissionCase[] | null) => cases?.find(isFailed) ?? null;

/** Tests with full points over the problem's test count; null when the viewer may not see the tests. */
export function passedCount(row: Pick<SubmissionDetail, 'cases' | 'totalCases'>) {
  if (!row.cases || row.cases.length === 0) return null;
  return {
    passed: row.cases.filter(isFullCase).length,
    total: row.totalCases ?? row.cases.length,
  };
}

/**
 * The slowest test and the largest memory of the tests the viewer sees: the two values a limit applies to (each test
 * runs against the limits by itself). Null without visible tests.
 */
export function peakOf(cases: SubmissionCase[] | null): { time: number; memory: number } | null {
  if (!cases || cases.length === 0) return null;
  return {
    time: Math.max(...cases.map((testCase) => testCase.time)),
    memory: Math.max(...cases.map((testCase) => testCase.memory)),
  };
}

/** The limits a submission ran against: its language's own when the problem sets them, else the problem's. */
export function limitsFor(
  problem: Pick<ProblemDetail, 'timeLimit' | 'memoryLimit' | 'languageLimits'> | undefined,
  languageKey: string | null,
): { time: number; memory: number } | null {
  if (!problem) return null;
  const own = problem.languageLimits.find((limit) => limit.language === languageKey);
  return {
    time: own?.timeLimit ?? problem.timeLimit,
    memory: own?.memoryLimit ?? problem.memoryLimit,
  };
}
