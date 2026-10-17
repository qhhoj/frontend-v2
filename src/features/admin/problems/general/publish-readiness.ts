import type { TestCase } from '@/api/types/problem-data';

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
