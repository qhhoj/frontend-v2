import { apiPage, apiRequest } from './client';
import type {
  SubmissionDetail,
  SubmissionListItem,
  SubmissionListQuery,
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
