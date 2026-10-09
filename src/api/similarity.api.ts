import { apiGet, apiGetPage, apiSend } from './typed';
import type { PairsRequest, SimilarityScope } from './types/similarity';

export const SIMILARITY_PAIRS_PAGE_SIZE = 50;

export const startSimilarityRun = (scope: SimilarityScope) =>
  apiSend('post', '/similarity/runs', { body: scope });

export const fetchSimilarityRuns = (scope: SimilarityScope) =>
  apiGet('/similarity/runs', { query: scope });

export const fetchSimilarityRun = (runId: string) =>
  apiGet('/similarity/runs/{runId}', { path: { runId } });

export const fetchSimilarityPairs = (runId: string, request: PairsRequest) =>
  apiGetPage('/similarity/runs/{runId}/pairs', {
    path: { runId },
    query: { ...request, pageSize: SIMILARITY_PAIRS_PAGE_SIZE },
  });

export const fetchSimilarityPair = (pairId: string) =>
  apiGet('/similarity/pairs/{pairId}', { path: { pairId } });
