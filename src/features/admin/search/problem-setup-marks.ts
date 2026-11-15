import type { ProblemListItem } from '@/api/types/problems';

export type SetupGap = 'statement' | 'tests' | 'points';

/** The editor tab that fixes each gap: the statement lives in "Đề bài", tests and points in "Dữ liệu chấm". */
export const GAP_ROUTE: Record<SetupGap, string> = {
  statement: 'admin-problemStatements',
  tests: 'admin-problemData',
  points: 'admin-problemData',
};

/**
 * What a problem still lacks, in setup order. `null` when the row has no readiness (the viewer may not edit it, or the
 * backfill has not reached it): the list then shows no mark at all, never a guess.
 */
export function setupGapsOf(setup: ProblemListItem['setup']): SetupGap[] | null {
  if (!setup) return null;
  const gaps: SetupGap[] = [];
  if (!setup.hasStatement) gaps.push('statement');
  if (!setup.hasTests) gaps.push('tests');
  if (!setup.hasPoints) gaps.push('points');
  return gaps;
}
