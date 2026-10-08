import { apiPage, apiRequest } from './client';
import type {
  SubmissionDetail,
  SubmissionListItem,
  SubmissionListQuery,
  SubmissionSource,
  SubmissionStats,
  SubmitBody,
  SubmitResponse,
} from './types/submissions';

export const fetchSubmissions = (query: SubmissionListQuery) =>
  apiPage<SubmissionListItem>('/submissions', { query: { ...query } });
export const fetchSubmission = (id: string) =>
  apiRequest<SubmissionDetail>(`/submissions/${encodeURIComponent(id)}`);
export const submit = (problemCode: string, body: SubmitBody) =>
  apiRequest<SubmitResponse>(`/problems/${encodeURIComponent(problemCode)}/submit`, {
    method: 'POST',
    body,
  });
export const fetchSubmissionSource = (id: string) =>
  apiRequest<SubmissionSource>(`/submissions/${encodeURIComponent(id)}/source`);
/** backend B24: aggregate numbers of today for the list's stats strip (public). */
export const fetchSubmissionStats = () => apiRequest<SubmissionStats>('/submissions/stats');
/** File-only languages (B17): multipart with `language` (the language id, first) and `file`. */
export const submitFile = (
  problemCode: string,
  { language, file }: { language: string; file: File },
) => {
  const form = new FormData();
  form.append('language', language);
  form.append('file', file);
  return apiRequest<SubmitResponse>(`/problems/${encodeURIComponent(problemCode)}/submit/file`, {
    method: 'POST',
    body: form,
  });
};
