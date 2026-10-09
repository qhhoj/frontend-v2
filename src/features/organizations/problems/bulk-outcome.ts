import type { BulkProblemsResult, BulkResult } from '@/api/types/organization-problems';

/** After a bulk action only the codes that were not done stay ticked, so a retry acts on them alone. */
export function remainingSelection(selected: string[], result: BulkProblemsResult): string[] {
  const done = new Set(
    result.results.filter((row) => row.outcome === 'done').map((row) => row.code),
  );
  return selected.filter((code) => !done.has(code));
}

export const isFullSuccess = (result: BulkProblemsResult): boolean => result.skipped === 0;

/** The line of one code in the result card. */
export function rowTextKey(row: BulkResult): string {
  if (row.outcome === 'done') return 'orgProblems.bulk.rowDone';
  return row.reason === 'not_found'
    ? 'orgProblems.bulk.rowNotFound'
    : 'orgProblems.bulk.rowSkipped';
}
