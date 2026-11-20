import type { TestCase } from '@/api/types/problem-data';
import type { EditableProblem } from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import { formatMemoryLimit, formatTimeLimit } from '@/lib/measure';
import { caseCount } from '../data/test-cases';
import type { ProblemForm } from '../general/problem-form';
import { scoredCasePoints } from '../general/publish-readiness';
import { STATEMENT_SLOTS, writtenSlots } from '../statements/statement-drafts';

const KEY = 'admin.problems.workbench.summary';
const SEPARATOR = ' · ';

/** Section 1 in one line: "Mã 11tin_palin · 1,0 s · 256 MB · 100 điểm · chấm từng phần". An emptied box is left out. */
export function infoSummary(form: ProblemForm): string {
  const isNumber = (value: unknown): value is number => typeof value === 'number';
  return [
    translate(`${KEY}.code`, { code: form.code }),
    isNumber(form.timeLimit) ? formatTimeLimit(form.timeLimit) : null,
    isNumber(form.memoryLimit) ? formatMemoryLimit(form.memoryLimit) : null,
    isNumber(form.points) ? translate(`${KEY}.points`, { points: form.points }) : null,
    translate(`${KEY}.${form.partial ? 'partial' : 'allOrNothing'}`),
  ]
    .filter(Boolean)
    .join(SEPARATOR);
}

/** Section 2 in one line: the languages written, whether there is a PDF and an editorial (all as saved). */
export function statementSummary(problem: EditableProblem): string {
  const written = writtenSlots(problem);
  const languages = STATEMENT_SLOTS.filter((slot) => written[slot]).map((slot) =>
    translate(`admin.problems.statements.slots.${slot}`),
  );
  return [
    languages.length ? languages.join(', ') : translate(`${KEY}.noStatement`),
    translate(`${KEY}.${problem.pdfStatementUrl ? 'hasPdf' : 'noPdf'}`),
    translate(`${KEY}.${problem.hasEditorial ? 'hasEditorial' : 'noEditorial'}`),
  ].join(SEPARATOR);
}

/** The test table's total line: how many tests and groups, and whether their points add up to the problem's. */
export interface TestsSummary {
  tests: number;
  groups: number;
  sum: number;
  points: number;
  isAddingUp: boolean;
}
export function testsSummary(cases: readonly TestCase[], problemPoints: number): TestsSummary {
  const sum = scoredCasePoints(cases);
  return {
    tests: caseCount([...cases]),
    groups: cases.filter((testCase) => testCase.type === 'S').length,
    sum,
    points: problemPoints,
    isAddingUp: sum === problemPoints,
  };
}
