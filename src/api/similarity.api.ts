import { apiPage, apiRequest } from './client';
import type {
  PairsRequest,
  SimilarityPair,
  SimilarityPairDetail,
  SimilarityRun,
  SimilarityScope,
} from './types/similarity';

export const SIMILARITY_PAIRS_PAGE_SIZE = 50;

export const startSimilarityRun = (scope: SimilarityScope) =>
  apiRequest<{ runId: string }>('/similarity/runs', { method: 'POST', body: scope });

export const fetchSimilarityRuns = (scope: SimilarityScope) =>
  apiRequest<SimilarityRun[]>('/similarity/runs', { query: { ...scope } });

export const fetchSimilarityRun = (runId: string) =>
  apiRequest<SimilarityRun>(`/similarity/runs/${encodeURIComponent(runId)}`);

export const fetchSimilarityPairs = (runId: string, request: PairsRequest) =>
  apiPage<SimilarityPair>(`/similarity/runs/${encodeURIComponent(runId)}/pairs`, {
    query: { ...request, pageSize: SIMILARITY_PAIRS_PAGE_SIZE },
  });

export const fetchSimilarityPair = (pairId: string) =>
  apiRequest<SimilarityPairDetail>(`/similarity/pairs/${encodeURIComponent(pairId)}`);
