import type { CaseStatus, SubmissionBatch, SubmissionCase } from '@/api/types/submissions';

/** The case status of a test the judge did not run because an earlier test of its subtask failed. */
export const SKIPPED_STATUS: CaseStatus = 'SC';

export interface OverviewRow {
  key: string;
  /** The subtask number; null for the single row of a problem without subtasks. */
  batch: number | null;
  cases: SubmissionCase[];
  /** The first failing status, else AC (or SC when every test was skipped). */
  verdict: CaseStatus;
  passedCount: number;
  skippedCount: number;
  /** The first failing test, when there is one. */
  failedPosition: number | null;
  earned: number;
  max: number;
}

const isSkipped = (testCase: SubmissionCase) => testCase.status === SKIPPED_STATUS;
const isFailed = (testCase: SubmissionCase) => testCase.status !== 'AC' && !isSkipped(testCase);
const sumOf = (cases: SubmissionCase[], field: 'points' | 'total') =>
  cases.reduce((sum, testCase) => sum + testCase[field], 0);

/** A subtask is all-or-nothing: its points are its maximum only when every test passed. */
function subtaskPoints(
  batch: number,
  cases: SubmissionCase[],
  batches: SubmissionBatch[] | null,
): { earned: number; max: number } {
  const summary = batches?.find((candidate) => candidate.batch === batch);
  if (summary) return { earned: summary.points, max: summary.total };
  const max = Math.max(...cases.map((testCase) => testCase.total));
  return { earned: cases.every((testCase) => testCase.status === 'AC') ? max : 0, max };
}

function buildRow(
  key: string,
  batch: number | null,
  cases: SubmissionCase[],
  batches: SubmissionBatch[] | null,
): OverviewRow {
  const failed = cases.find(isFailed);
  const points =
    batch === null
      ? { earned: sumOf(cases, 'points'), max: sumOf(cases, 'total') }
      : subtaskPoints(batch, cases, batches);
  return {
    key,
    batch,
    cases,
    verdict: failed?.status ?? (cases.every(isSkipped) ? SKIPPED_STATUS : 'AC'),
    passedCount: cases.filter((testCase) => testCase.status === 'AC').length,
    skippedCount: cases.filter(isSkipped).length,
    failedPosition: failed?.position ?? null,
    ...points,
  };
}

/** One row per subtask in order of number, or a single row holding every test when the problem has no subtasks. */
export function buildOverviewRows(
  cases: SubmissionCase[] | null,
  batches: SubmissionBatch[] | null,
): OverviewRow[] {
  if (!cases || cases.length === 0) return [];
  const byBatch = new Map<number, SubmissionCase[]>();
  for (const testCase of cases) {
    if (testCase.batch === null) continue;
    byBatch.set(testCase.batch, [...(byBatch.get(testCase.batch) ?? []), testCase]);
  }
  if (byBatch.size === 0) return [buildRow('all', null, cases, batches)];
  return [...byBatch.entries()]
    .sort(([left], [right]) => left - right)
    .map(([batch, batchCases]) => buildRow(`batch-${batch}`, batch, batchCases, batches));
}

/** How the points cell is coloured: full marks, nothing, or in between. */
export function earnedTone(earned: number, max: number): 'full' | 'none' | 'partial' {
  if (earned === 0) return 'none';
  return earned >= max ? 'full' : 'partial';
}
