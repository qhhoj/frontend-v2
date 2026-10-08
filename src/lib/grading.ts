import type { SubmissionDetail } from '@/api/types/submissions';

interface CaseTotals {
  casePoints: number;
  caseTotal: number;
}
const clamp = (fraction: number) => Math.min(1, Math.max(0, fraction));

/** backend `casePoints` and `caseTotal` are points, not test counts. */
export const ringFraction = ({ casePoints, caseTotal }: CaseTotals) =>
  caseTotal > 0 ? clamp(casePoints / caseTotal) : 0;

export const provisionalPoints = (problemPoints: number, totals: CaseTotals) =>
  Math.round(problemPoints * ringFraction(totals) * 100) / 100;

export type RingProgress =
  | { mode: 'cases'; graded: number; total: number; fraction: number }
  | { mode: 'points'; fraction: number };

/** Graded tests of the total when the viewer sees the cases and their count (`totalCases`, B21), else the share of points. */
export function ringProgress(
  row: Pick<SubmissionDetail, 'cases' | 'totalCases' | 'casePoints' | 'caseTotal'>,
): RingProgress {
  if (row.cases && row.totalCases)
    return {
      mode: 'cases',
      graded: row.cases.length,
      total: row.totalCases,
      fraction: clamp(row.cases.length / row.totalCases),
    };
  return { mode: 'points', fraction: ringFraction(row) };
}
