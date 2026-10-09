import { apiGet, apiGetPage, apiSend } from './typed';
import type { Page } from './client';
import type { SubmissionListItem, SubmissionListQuery } from './types/submissions';
import type { Announcement, ContestListQuery } from './types/contests';

export const ANNOUNCEMENT_PAGE_SIZE = 20;
export const ANNOUNCEMENT_FIRST_PAGE = 1;

/** The code goes only when the viewer typed one (an empty string is a wrong code); `acceptRules` only when the box was ticked. */
const joinBody = (accessCode?: string, acceptRules?: boolean) => ({
  ...(accessCode ? { accessCode } : {}),
  ...(acceptRules ? { acceptRules: true } : {}),
});

export const fetchContests = (query: ContestListQuery) => apiGetPage('/contests', { query });
export const fetchContest = (key: string) => apiGet('/contests/{key}', { path: { key } });
export const fetchRanking = (key: string, withVirtual: boolean) =>
  apiGet('/contests/{key}/ranking', { path: { key }, query: { virtual: withVirtual } });

export const joinContest = (key: string, accessCode?: string, acceptRules?: boolean) =>
  apiSend('post', '/contests/{key}/join', {
    path: { key },
    body: joinBody(accessCode, acceptRules),
  });
export const registerContest = (key: string, accessCode?: string, acceptRules?: boolean) =>
  apiSend('post', '/contests/{key}/register', {
    path: { key },
    body: joinBody(accessCode, acceptRules),
  });
export const leaveContest = (key: string) =>
  apiSend('post', '/contests/{key}/leave', { path: { key } });
export const fetchCurrentParticipation = () => apiGet('/contests/current');
export const fetchContestAnnouncements = (key: string, page: number): Promise<Page<Announcement>> =>
  apiGetPage('/contests/{key}/announcements', {
    path: { key },
    query: { page, pageSize: ANNOUNCEMENT_PAGE_SIZE },
  });
export const fetchContestSubmissions = (
  key: string,
  query: SubmissionListQuery,
): Promise<Page<SubmissionListItem>> =>
  apiGetPage('/contests/{key}/submissions', { path: { key }, query });
export const fetchContestStats = (key: string) =>
  apiGet('/contests/{key}/stats', { path: { key } });
