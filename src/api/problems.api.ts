import { apiGet, apiGetPage, apiUrl } from './typed';
import type {
  ProblemDetail,
  ProblemEditorial,
  ProblemListItem,
  ProblemListQuery,
  ProblemMeta,
  StatementLanguage,
} from './types/problems';

export const fetchProblemMeta = (): Promise<ProblemMeta> => apiGet('/problems/meta');
export const fetchProblems = (query: ProblemListQuery) =>
  apiGetPage('/problems', { query }) satisfies Promise<{ items: ProblemListItem[] }>;
export const fetchProblem = (code: string, lang: StatementLanguage): Promise<ProblemDetail> =>
  apiGet('/problems/{code}', { path: { code }, query: { lang } });
export const fetchEditorial = (code: string, lang: StatementLanguage): Promise<ProblemEditorial> =>
  apiGet('/problems/{code}/editorial', { path: { code }, query: { lang } });
/** Probed by `probePdf` (202 while rendering, B20) and opened in a new tab once ready. */
export const problemPdfUrl = (code: string, lang: StatementLanguage) =>
  apiUrl('/problems/{code}/pdf', { path: { code }, query: { lang } });
