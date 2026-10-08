import { apiPage, apiRequest } from './client';
import type {
  Announcement,
  ContestBody,
  ContestPatch,
  EditableContest,
} from './types/contest-editing';

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

const announcementsPath = (key: string) => `${contestPath(key)}/announcements`;
export const ANNOUNCEMENTS_PAGE_SIZE = 20;
export const fetchAnnouncements = (key: string, page: number) =>
  apiPage<Announcement>(announcementsPath(key), {
    query: { page, pageSize: ANNOUNCEMENTS_PAGE_SIZE },
  });
export const postAnnouncement = (key: string, body: { title: string; description: string }) =>
  apiRequest<Announcement>(announcementsPath(key), { method: 'POST', body });
export const resendAnnouncement = (key: string, id: string) =>
  apiRequest<void>(`${announcementsPath(key)}/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
  });
export const deleteAnnouncement = (key: string, id: string) =>
  apiRequest<void>(`${announcementsPath(key)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
