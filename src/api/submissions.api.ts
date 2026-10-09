import { apiGet, apiGetPage, apiSend } from './typed';
import type { SubmissionListQuery, SubmitBody } from './types/submissions';

export const fetchSubmissions = (query: SubmissionListQuery) =>
  apiGetPage('/submissions', { query });
export const fetchSubmission = (id: string) => apiGet('/submissions/{id}', { path: { id } });
export const submit = (problemCode: string, body: SubmitBody) =>
  apiSend('post', '/problems/{code}/submit', { path: { code: problemCode }, body });
export const fetchSubmissionSource = (id: string) =>
  apiGet('/submissions/{id}/source', { path: { id } });
/** Aggregate numbers of today for the list's stats strip (public). */
export const fetchSubmissionStats = () => apiGet('/submissions/stats');
/** File-only languages: multipart with `language` (the language id, first) and `file`. */
export const submitFile = (
  problemCode: string,
  { language, file }: { language: string; file: File },
) => {
  const body = new FormData();
  body.append('language', language);
  body.append('file', file);
  return apiSend('post', '/problems/{code}/submit/file', { path: { code: problemCode }, body });
};
