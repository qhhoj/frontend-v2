import { apiPage, apiRequest } from './client';
import type { Page } from './client';
import type { SubmissionListItem, SubmissionListQuery } from './types/submissions';
import type {
  Announcement,
  ContestDetail,
  ContestListItem,
  ContestListQuery,
  ContestStats,
  CurrentParticipation,
  ParticipationSummary,
  Ranking,
} from './types/contests';

export const ANNOUNCEMENT_PAGE_SIZE = 20;

const contestPath = (key: string, rest = '') => `/contests/${encodeURIComponent(key)}${rest}`;
/** The code goes only when the viewer typed one: the backend treats an empty string as a wrong code. */
const codeBody = (accessCode?: string) => (accessCode ? { accessCode } : {});

export const fetchContests = (query: ContestListQuery) =>
  apiPage<ContestListItem>('/contests', { query: { ...query } });
export const fetchContest = (key: string) => apiRequest<ContestDetail>(contestPath(key));
export const fetchRanking = (key: string, withVirtual: boolean) =>
  apiRequest<Ranking>(contestPath(key, '/ranking'), { query: { virtual: withVirtual } });

export const joinContest = (key: string, accessCode?: string) =>
  apiRequest<ParticipationSummary>(contestPath(key, '/join'), {
    method: 'POST',
    body: codeBody(accessCode),
  });
export const registerContest = (key: string, accessCode?: string) =>
  apiRequest<ParticipationSummary>(contestPath(key, '/register'), {
    method: 'POST',
    body: codeBody(accessCode),
  });
export const leaveContest = (key: string) =>
  apiRequest<void>(contestPath(key, '/leave'), { method: 'POST' });
export const fetchCurrentParticipation = () =>
  apiRequest<CurrentParticipation | null>('/contests/current');
export const fetchContestAnnouncements = (key: string, page: number): Promise<Page<Announcement>> =>
  apiPage<Announcement>(contestPath(key, '/announcements'), {
    query: { page, pageSize: ANNOUNCEMENT_PAGE_SIZE },
  });
export const fetchContestSubmissions = (key: string, query: SubmissionListQuery) =>
  apiPage<SubmissionListItem>(contestPath(key, '/submissions'), { query: { ...query } });
export const fetchContestStats = (key: string) =>
  apiRequest<ContestStats>(contestPath(key, '/stats'));
