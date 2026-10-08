import { apiPage, apiRequest } from './client';
import type {
  ProblemDetail,
  ProblemEditorial,
  ProblemListItem,
  ProblemListQuery,
  ProblemMeta,
  StatementLanguage,
} from './types/problems';

export const fetchProblemMeta = () => apiRequest<ProblemMeta>('/problems/meta');
export const fetchProblems = (query: ProblemListQuery) =>
  apiPage<ProblemListItem>('/problems', { query: { ...query } });
export const fetchProblem = (code: string, lang: StatementLanguage) =>
  apiRequest<ProblemDetail>(`/problems/${encodeURIComponent(code)}`, { query: { lang } });
export const fetchEditorial = (code: string, lang: StatementLanguage) =>
  apiRequest<ProblemEditorial>(`/problems/${encodeURIComponent(code)}/editorial`, {
    query: { lang },
  });
/** Probed by `probePdf` (202 while rendering, B20) and opened in a new tab once ready. */
export const problemPdfUrl = (code: string, lang: StatementLanguage) =>
  `/api/internal/problems/${encodeURIComponent(code)}/pdf?lang=${lang}`;
