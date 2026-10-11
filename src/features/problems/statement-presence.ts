import type { ProblemDetail } from '@/api/types/problems';

type StatementFields = Pick<ProblemDetail, 'descriptionHtml' | 'pdfStatementUrl'>;

/** The rendered PDF prints the text statement; a statement that is only an uploaded PDF has none. */
export const hasTextStatement = (problem: StatementFields): boolean =>
  problem.descriptionHtml.trim() !== '';

/** A problem with neither text nor an uploaded PDF (an invisible problem is a 404, never an empty detail). */
export const hasNoStatement = (problem: StatementFields): boolean =>
  !hasTextStatement(problem) && !problem.pdfStatementUrl;
