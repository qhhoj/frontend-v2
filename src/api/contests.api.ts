import { apiPage, apiRequest } from './client';
import type { ContestDetail, ContestListItem, ContestListQuery, Ranking } from './types/contests';

export const fetchContests = (query: ContestListQuery) =>
  apiPage<ContestListItem>('/contests', { query: { ...query } });
export const fetchContest = (key: string) =>
  apiRequest<ContestDetail>(`/contests/${encodeURIComponent(key)}`);
export const fetchRanking = (key: string, withVirtual: boolean) =>
  apiRequest<Ranking>(`/contests/${encodeURIComponent(key)}/ranking`, {
    query: { virtual: withVirtual },
  });
