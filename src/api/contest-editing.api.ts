import { apiRequest } from './client';
import type { ContestBody, ContestPatch, EditableContest } from './types/contest-editing';

export const contestPath = (key: string) => `/contests/${encodeURIComponent(key)}`;

export const fetchEditableContest = (key: string) => apiRequest<EditableContest>(contestPath(key));
export const createContest = (body: ContestBody) =>
  apiRequest<EditableContest>('/contests', { method: 'POST', body });
export const updateContest = (key: string, patch: ContestPatch) =>
  apiRequest<EditableContest>(contestPath(key), { method: 'PATCH', body: patch });
export const cloneContest = (key: string, newKey: string) =>
  apiRequest<EditableContest>(`${contestPath(key)}/clone`, {
    method: 'POST',
    body: { key: newKey },
  });
