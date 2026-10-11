import type { TestCase } from '@/api/types/problem-data';

export type PublishIssue = 'noCases' | 'noCasePoints' | 'noProblemPoints';

/** Points the judge can award: a batch scores through its `S` row (its cases' own points are ignored), a lone case through itself. */
export function scoredCasePoints(cases: readonly TestCase[]): number {
  let isInBatch = false;
  let total = 0;
  for (const testCase of cases) {
    if (testCase.type === 'S') isInBatch = true;
    if (testCase.type === 'S' || (testCase.type === 'C' && !isInBatch))
      total += testCase.points ?? 0;
    if (testCase.type === 'E') isInBatch = false;
  }
  return total;
}

/** What makes a problem unsolvable for points once public: no test cases, cases worth nothing, or a problem worth nothing. */
export function publishIssues(cases: readonly TestCase[], problemPoints: number): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (!cases.some((testCase) => testCase.type === 'C')) issues.push('noCases');
  else if (scoredCasePoints(cases) <= 0) issues.push('noCasePoints');
  if (problemPoints <= 0) issues.push('noProblemPoints');
  return issues;
}
