import { ApiError, apiPage, apiRequest } from './client';
import type {
  Announcement,
  ContestBody,
  ContestPatch,
  EditableContest,
  OfficialRanking,
  RankingLink,
  RankingLinkPatch,
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

/** A 404 is a state here (no table, no link yet), not an error. */
const nullOn404 = <Result>(promise: Promise<Result>) =>
  promise.catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

export const fetchOfficialRanking = (key: string) =>
  nullOn404(apiRequest<OfficialRanking>(`${contestPath(key)}/official-ranking`));
export const putOfficialRanking = (key: string, body: { csv: string } | { url: string }) =>
  apiRequest<OfficialRanking>(`${contestPath(key)}/official-ranking`, { method: 'PUT', body });
export const deleteOfficialRanking = (key: string) =>
  apiRequest<void>(`${contestPath(key)}/official-ranking`, { method: 'DELETE' });

export const fetchRankingLink = (key: string) =>
  nullOn404(apiRequest<RankingLink>(`${contestPath(key)}/ranking-link`));
export const createRankingLink = (key: string) =>
  apiRequest<RankingLink>(`${contestPath(key)}/ranking-link`, { method: 'POST' });
export const updateRankingLink = (key: string, patch: RankingLinkPatch) =>
  apiRequest<RankingLink>(`${contestPath(key)}/ranking-link`, { method: 'PATCH', body: patch });
export const regenerateRankingLink = (key: string) =>
  apiRequest<RankingLink>(`${contestPath(key)}/ranking-link/regenerate`, { method: 'POST' });
