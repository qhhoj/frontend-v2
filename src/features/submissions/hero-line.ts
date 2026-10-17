import type { CaseStatus, SubmissionDetail } from '@/api/types/submissions';
import { formatCaseMemory, formatCaseTime } from '@/lib/format';
import { isFailed, isFullCase } from './test-overview';

/** One part of the hero's second line: an i18n key and its values, or a ready text (time, memory, language). */
export type HeroPart =
  | { key: 'failed'; values: { number: number; status: CaseStatus } }
  | { key: 'passed'; values: { passed: number; total: number } }
  | { text: string };

type HeroSource = Pick<SubmissionDetail, 'cases' | 'totalCases' | 'time' | 'memory' | 'language'>;

/**
 * The line under the verdict: the first failing test, how many tests passed with full points (as in the overview), then
 * time, memory and language, each only when known. Hidden case results (`cases` null) leave out the test parts.
 */
export function heroParts(row: HeroSource): HeroPart[] {
  const parts: HeroPart[] = [];
  if (row.cases && row.cases.length > 0) {
    const failed = row.cases.find(isFailed);
    if (failed)
      parts.push({ key: 'failed', values: { number: failed.position, status: failed.status } });
    const passed = row.cases.filter(isFullCase).length;
    parts.push({
      key: 'passed',
      values: { passed, total: row.totalCases ?? row.cases.length },
    });
  }
  if (row.time !== null) parts.push({ text: formatCaseTime(row.time) });
  if (row.memory !== null) parts.push({ text: formatCaseMemory(row.memory) });
  if (row.language) parts.push({ text: row.language.name });
  return parts;
}
