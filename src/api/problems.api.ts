import { apiPage, apiRequest } from './client';
import type { ProblemListItem, ProblemListQuery, ProblemMeta } from './types/problems';

export const fetchProblemMeta = () => apiRequest<ProblemMeta>('/problems/meta');
export const fetchProblems = (query: ProblemListQuery) =>
  apiPage<ProblemListItem>('/problems', { query: { ...query } });
