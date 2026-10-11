import type { DeletedProblem } from '@/api/types/problem-lifecycle';

/** The grace column's text key and count: purged beats everything, then "due" at zero days, else the days left. */
export function graceTextOf(row: Pick<DeletedProblem, 'daysLeft' | 'isPurged'>): {
  key: string;
  count: number;
} {
  if (row.isPurged) return { key: 'admin.lifecycle.grace.purged', count: 0 };
  if (row.daysLeft === 0) return { key: 'admin.lifecycle.grace.due', count: 0 };
  return { key: 'admin.lifecycle.grace.left', count: row.daysLeft };
}

/** The grace chip's tone: due is negative, under a week caution, otherwise (and once purged) neutral. */
const CAUTION_DAYS = 7;
export function graceToneOf(
  row: Pick<DeletedProblem, 'daysLeft' | 'isPurged'>,
): 'neutral' | 'caution' | 'negative' {
  if (row.isPurged) return 'neutral';
  if (row.daysLeft === 0) return 'negative';
  return row.daysLeft < CAUTION_DAYS ? 'caution' : 'neutral';
}
