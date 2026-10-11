import { ApiError } from './client';
import { apiGet, apiGetPage, apiSend, apiUrl } from './typed';
import type {
  ContestBody,
  ContestPatch,
  PrepareDataBody,
  RankingLinkPatch,
} from './types/contest-editing';

export const fetchEditableContest = (key: string) => apiGet('/contests/{key}', { path: { key } });
export const createContest = (body: ContestBody) => apiSend('post', '/contests', { body });
/** An organization-private contest of `slug` (organization administrators with `create_private_contest`). */
export const createOrganizationContest = (slug: string, body: ContestBody) =>
  apiSend('post', '/organizations/{slug}/contests', { path: { slug }, body });
export const updateContest = (key: string, patch: ContestPatch) =>
  apiSend('patch', '/contests/{key}', { path: { key }, body: patch });
export const cloneContest = (key: string, newKey: string) =>
  apiSend('post', '/contests/{key}/clone', { path: { key }, body: { key: newKey } });

export const ANNOUNCEMENTS_PAGE_SIZE = 20;
export const fetchAnnouncements = (key: string, page: number) =>
  apiGetPage('/contests/{key}/announcements', {
    path: { key },
    query: { page, pageSize: ANNOUNCEMENTS_PAGE_SIZE },
  });
export const postAnnouncement = (key: string, body: { title: string; description: string }) =>
  apiSend('post', '/contests/{key}/announcements', { path: { key }, body });
export const resendAnnouncement = (key: string, id: string) =>
  apiSend('post', '/contests/{key}/announcements/{id}/resend', { path: { key, id } });
export const deleteAnnouncement = (key: string, id: string) =>
  apiSend('delete', '/contests/{key}/announcements/{id}', { path: { key, id } });

/** A 404 is a state here (no table, no link yet), not an error. */
const nullOn404 = <Result>(promise: Promise<Result>) =>
  promise.catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

export const fetchOfficialRanking = (key: string) =>
  nullOn404(apiGet('/contests/{key}/official-ranking', { path: { key } }));
export const putOfficialRanking = (key: string, body: { csv: string } | { url: string }) =>
  apiSend('put', '/contests/{key}/official-ranking', { path: { key }, body });
export const deleteOfficialRanking = (key: string) =>
  apiSend('delete', '/contests/{key}/official-ranking', { path: { key } });

export const fetchRankingLink = (key: string) =>
  nullOn404(apiGet('/contests/{key}/ranking-link', { path: { key } }));
export const createRankingLink = (key: string) =>
  apiSend('post', '/contests/{key}/ranking-link', { path: { key } });
export const updateRankingLink = (key: string, patch: RankingLinkPatch) =>
  apiSend('patch', '/contests/{key}/ranking-link', { path: { key }, body: patch });
export const regenerateRankingLink = (key: string) =>
  apiSend('post', '/contests/{key}/ranking-link/regenerate', { path: { key } });

export const rescoreContest = (key: string) =>
  apiSend('post', '/contests/{key}/rescore', { path: { key } });
export const judgeFinal = (key: string) =>
  apiSend('post', '/contests/{key}/judge-final', { path: { key } });
export const rateContest = (key: string) =>
  apiSend('post', '/contests/{key}/rate', { path: { key } });
export const fetchContestActions = (key: string) =>
  apiGet('/contests/{key}/actions', { path: { key } });

export const fetchContestData = (key: string) => apiGet('/contests/{key}/data', { path: { key } });
export const prepareContestData = (key: string, body: PrepareDataBody) =>
  apiSend('post', '/contests/{key}/data', { path: { key }, body });
/** A plain link: the zip downloads with the session cookie, no envelope. */
export const contestDataDownloadUrl = (key: string) =>
  apiUrl('/contests/{key}/data/download', { path: { key } });

export const PARTICIPATIONS_PAGE_SIZE = 50;
/** The editor's list filters; an empty username or search (dropped by the client) or a missing kind or sort is no filter. */
export interface ParticipationQuery {
  page: number;
  /** Exact username. */
  user: string;
  /** Part of a username, case-insensitive (editors only). */
  search: string;
  kind?: 'live' | 'virtual' | 'spectate';
  disqualified?: boolean;
  sort?: 'score';
}
export const fetchParticipations = (key: string, query: ParticipationQuery) =>
  apiGetPage('/contests/{key}/participations', {
    path: { key },
    query: { ...query, pageSize: PARTICIPATIONS_PAGE_SIZE },
  });
export const setDisqualified = (key: string, id: string, disqualified: boolean) =>
  apiSend('post', '/contests/{key}/participations/{id}/disqualify', {
    path: { key, id },
    body: { disqualified },
  });
