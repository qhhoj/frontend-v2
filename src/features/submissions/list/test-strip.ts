import type { SubmissionListItem } from '@/api/types/submissions';
import { VERDICT_TONES } from '@/lib/verdicts';

export type TestSummary = NonNullable<SubmissionListItem['testSummary']>;
export type CaseCode = TestSummary['statuses'][number];

/** A strip draws at most this many cells; the backend sends at most 100 results. */
export const MAX_STRIP_CELLS = 100;
/** Up to this many cells, each failed cell also shows its verdict letter; past it, a hatch marks it. */
export const LETTERED_CELLS_MAX = 40;

/** One cell: a test (or a batch) with its verdict, or one not judged yet (`status` null). */
export interface StripCell {
  /** Test or batch number, from 1. */
  number: number;
  status: CaseCode | null;
}

/** The judged entries in order, then a pending cell for each test the problem has that is not judged yet. */
export function stripCells(summary: TestSummary): StripCell[] {
  const judged = summary.statuses.map((status, index) => ({
    number: summary.unit === 'batch' ? (summary.batches[index] ?? index + 1) : index + 1,
    status,
  }));
  const unjudged =
    summary.unit === 'case' && summary.total !== null && summary.more === 0
      ? Math.max(0, summary.total - judged.length)
      : 0;
  const pending = Math.min(unjudged, MAX_STRIP_CELLS - judged.length);
  return [
    ...judged,
    ...Array.from({ length: pending }, (_unused, index) => ({
      number: judged.length + index + 1,
      status: null,
    })),
  ];
}

export interface StripCounts {
  /** Accepted entries among the shown ones. */
  passed: number;
  /** What `passed` is out of: the problem's tests, or the shown entries when that count is unknown or capped. */
  outOf: number;
  /** Failed entries per verdict, most first. */
  failures: [CaseCode, number][];
  /** Judged tests past the shown ones. */
  more: number;
}

/** The numbers the strip's text line says, so colour is never the only cue. */
export function stripCounts(summary: TestSummary): StripCounts {
  const passed = summary.statuses.filter((status) => status === 'AC').length;
  const failed = new Map<CaseCode, number>();
  for (const status of summary.statuses)
    if (status !== 'AC') failed.set(status, (failed.get(status) ?? 0) + 1);
  const isWhole = summary.unit === 'case' && summary.total !== null && summary.more === 0;
  return {
    passed,
    outOf: isWhole
      ? Math.max(summary.total ?? 0, summary.statuses.length)
      : summary.statuses.length,
    failures: [...failed].sort((left, right) => right[1] - left[1]),
    more: summary.more,
  };
}

/** The cell's colour as a token: its verdict's solid fill. */
export const cellColourVar = (status: CaseCode) =>
  `--qh-verdict-${VERDICT_TONES[status] === 'pending' ? 'ce' : VERDICT_TONES[status]}-solid`;
