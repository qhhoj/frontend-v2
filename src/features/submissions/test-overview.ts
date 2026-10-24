import type { CaseStatus, SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import { translate, type Locale } from '@/i18n';
import { formatNumber, scoreBelowFull } from '@/lib/format';
import { BLOCK_TONE_CLASSES, PARTIAL_CODE, caseVerdictOf, isPartial } from '@/lib/verdicts';

/** The case status of a test the judge did not run because an earlier test of its subtask failed. */
export const SKIPPED_STATUS: CaseStatus = 'SC';

export interface OverviewRow {
  key: string;
  /** The subtask number; null for the row of tests outside any subtask (every test when the problem has none). */
  batch: number | null;
  cases: SubmissionCase[];
  /** The first failing status, else PC when a test earned part of its points, else AC (or SC when every test was skipped). */
  verdict: CaseStatus | typeof PARTIAL_CODE;
  /** How the row adds its tests up: a subtask takes its lowest test's points, a plain list sums them. */
  rule: 'min' | 'sum';
  /** Tests with full points. */
  passedCount: number;
  /** Accepted tests that earned only part of their points. */
  partialCount: number;
  skippedCount: number;
  /** The first failing test, when there is one. */
  failedPosition: number | null;
  /** The test that set a subtask's points, when no test failed and the subtask is short of its maximum. */
  lowestPosition: number | null;
  earned: number;
  max: number;
}

/** Test and subtask points keep up to two decimals, e.g. `0,25`. */
const POINT_FRACTION_DIGITS = 2;
export const formatPoints = (value: number, locale: Locale) =>
  formatNumber(value, locale, POINT_FRACTION_DIGITS, false);
/** Earned points of `max`; short of it they stay short once rounded (`scoreBelowFull`). */
export const formatEarnedPoints = (points: number, max: number, locale: Locale) =>
  formatPoints(scoreBelowFull(points, max, POINT_FRACTION_DIGITS), locale);
/** Earned out of possible points, e.g. `0,5/1`. */
export const formatCasePoints = (points: number, total: number, locale: Locale) =>
  `${formatEarnedPoints(points, total, locale)}/${formatPoints(total, locale)}`;
/** A test's tile or square title: "Test 3: Sai kết quả, 0/1". */
export const caseTitle = (testCase: SubmissionCase, locale: Locale) =>
  translate('submission.overview.testTitle', {
    number: testCase.position,
    verdict: translate(caseVerdictOf(testCase).labelKey),
    points: formatCasePoints(testCase.points, testCase.total, locale),
  });

/** Positions of the tests after the graded ones; only a grading in progress with a known test count has them. */
export function pendingPositions(
  cases: SubmissionCase[] | null,
  totalCases: number | null,
  running: boolean,
): number[] {
  if (!running || !cases || !totalCases) return [];
  const first = cases.length + 1;
  return Array.from(
    { length: Math.max(0, totalCases - cases.length) },
    (_unused, offset) => first + offset,
  );
}

const isSkipped = (testCase: SubmissionCase) => testCase.status === SKIPPED_STATUS;
/** The tone of a test's square or tile: dashed when skipped, outlined when partial (the caller fills it), else solid by verdict. */
export function caseTileClass(testCase: SubmissionCase): string {
  if (isSkipped(testCase)) return 'border border-dashed border-line-strong';
  const { code, tone } = caseVerdictOf(testCase);
  return code === PARTIAL_CODE ? 'border border-verdict-partial' : BLOCK_TONE_CLASSES[tone];
}
/** A test that did not pass and was run (a skipped test is not a failure). */
export const isFailed = (testCase: SubmissionCase) =>
  testCase.status !== 'AC' && !isSkipped(testCase);
const isPartialCase = (testCase: SubmissionCase) =>
  isPartial(testCase.status, testCase.points, testCase.total);
/** An accepted test with all of its points. */
export const isFullCase = (testCase: SubmissionCase) =>
  testCase.status === 'AC' && !isPartialCase(testCase);
const sumOf = (cases: SubmissionCase[], field: 'points' | 'total') =>
  cases.reduce((sum, testCase) => sum + testCase[field], 0);

/** A subtask scores its smallest case points out of its largest case total, the rule the backend's batch summary uses. */
function subtaskPoints(
  batch: number,
  cases: SubmissionCase[],
  batches: SubmissionBatch[] | null,
): { earned: number; max: number } {
  const summary = batches?.find((candidate) => candidate.batch === batch);
  if (summary) return { earned: summary.points, max: summary.total };
  return {
    earned: Math.min(...cases.map((testCase) => testCase.points)),
    max: Math.max(...cases.map((testCase) => testCase.total)),
  };
}

function rowVerdict(cases: SubmissionCase[]): OverviewRow['verdict'] {
  const failed = cases.find(isFailed);
  if (failed) return failed.status;
  if (cases.every(isSkipped)) return SKIPPED_STATUS;
  return cases.some(isPartialCase) ? PARTIAL_CODE : 'AC';
}

/** The test whose points a subtask took: its lowest, first by position on a tie. */
const lowestCase = (cases: SubmissionCase[]) =>
  cases.reduce((lowest, testCase) => (testCase.points < lowest.points ? testCase : lowest));

function buildRow(
  key: string,
  batch: number | null,
  cases: SubmissionCase[],
  batches: SubmissionBatch[] | null,
): OverviewRow {
  const failed = cases.find(isFailed);
  const rule = batch === null ? 'sum' : 'min';
  const points =
    batch === null
      ? { earned: sumOf(cases, 'points'), max: sumOf(cases, 'total') }
      : subtaskPoints(batch, cases, batches);
  const isShortSubtask = rule === 'min' && !failed && points.earned < points.max;
  return {
    key,
    batch,
    cases,
    verdict: rowVerdict(cases),
    rule,
    passedCount: cases.filter(isFullCase).length,
    partialCount: cases.filter(isPartialCase).length,
    skippedCount: cases.filter(isSkipped).length,
    failedPosition: failed?.position ?? null,
    lowestPosition: isShortSubtask ? lowestCase(cases).position : null,
    ...points,
  };
}

/** The key of the summed row holding the tests outside any subtask, when the problem also has subtasks. */
export const PLAIN_ROW_KEY = 'plain';

function groupBySubtask(cases: SubmissionCase[]) {
  const plain: SubmissionCase[] = [];
  const byBatch = new Map<number, SubmissionCase[]>();
  for (const testCase of cases) {
    if (testCase.batch === null) plain.push(testCase);
    else byBatch.set(testCase.batch, [...(byBatch.get(testCase.batch) ?? []), testCase]);
  }
  return { plain, byBatch };
}

/**
 * One row per subtask in order of number, or a single row holding every test when the problem has no subtasks. Tests
 * outside any subtask next to subtasks get a summed row of their own (the backend adds their points too), placed before the
 * subtasks when its first test comes first, else after.
 */
export function buildOverviewRows(
  cases: SubmissionCase[] | null,
  batches: SubmissionBatch[] | null,
): OverviewRow[] {
  if (!cases || cases.length === 0) return [];
  const { plain, byBatch } = groupBySubtask(cases);
  if (byBatch.size === 0) return [buildRow('all', null, cases, batches)];
  const subtaskRows = [...byBatch.entries()]
    .sort(([left], [right]) => left - right)
    .map(([batch, batchCases]) => buildRow(`batch-${batch}`, batch, batchCases, batches));
  if (plain.length === 0) return subtaskRows;
  const plainRow = buildRow(PLAIN_ROW_KEY, null, plain, batches);
  const isFirst = plain[0]!.position < subtaskRows[0]!.cases[0]!.position;
  return isFirst ? [plainRow, ...subtaskRows] : [...subtaskRows, plainRow];
}

/** How the points cell is coloured: full marks, nothing, or in between. */
export function earnedTone(earned: number, max: number): 'full' | 'none' | 'partial' {
  if (earned === 0) return 'none';
  return earned >= max ? 'full' : 'partial';
}

/** One part of a row's reason line: an i18n key under `submission.overview` and its values. */
export interface ReasonPart {
  key: 'allPassed' | 'failed' | 'passed' | 'partial' | 'lowest' | 'skipped';
  values: Record<string, number | string>;
}

/** Why the row scored what it did, e.g. "15 correct · 5 partially correct"; the failing test's verdict is the caller's to name. */
export function reasonParts(row: OverviewRow): ReasonPart[] {
  if (row.failedPosition === null && row.skippedCount === 0 && row.partialCount === 0)
    return [{ key: 'allPassed', values: { passed: row.passedCount, total: row.cases.length } }];
  const parts: ReasonPart[] = [];
  if (row.failedPosition !== null)
    parts.push({ key: 'failed', values: { number: row.failedPosition, verdict: row.verdict } });
  else if (row.partialCount > 0) parts.push({ key: 'passed', values: { count: row.passedCount } });
  if (row.partialCount > 0) parts.push({ key: 'partial', values: { count: row.partialCount } });
  if (row.lowestPosition !== null)
    parts.push({ key: 'lowest', values: { number: row.lowestPosition } });
  if (row.skippedCount > 0) parts.push({ key: 'skipped', values: { count: row.skippedCount } });
  return parts;
}

/** The judge's own rounding: Python's `round(value, 3)` is close enough here, the check only allows for float noise. */
const SCORE_TOLERANCE = 1e-3;

/**
 * How test points became the score, for the explanation line: `casePoints / caseTotal × problemPoints`. Null when there is
 * nothing to explain (full marks, no tests) or when that formula does not give the stored points, e.g. a problem without
 * partial scoring, which gives 0 unless every test is full.
 */
export function scoreConversion(
  casePoints: number,
  caseTotal: number,
  points: number | null,
  problemPoints: number | null,
): { share: number } | null {
  if (points === null || problemPoints === null || caseTotal <= 0 || casePoints >= caseTotal)
    return null;
  const share = casePoints / caseTotal;
  return Math.abs(share * problemPoints - points) < SCORE_TOLERANCE ? { share } : null;
}
