import { apiRequest } from './client';
import type { SimilarityRun, SimilarityScope } from './types/similarity';

export const startSimilarityRun = (scope: SimilarityScope) =>
  apiRequest<{ runId: string }>('/similarity/runs', { method: 'POST', body: scope });

export const fetchSimilarityRuns = (scope: SimilarityScope) =>
  apiRequest<SimilarityRun[]>('/similarity/runs', { query: { ...scope } });

export const fetchSimilarityRun = (runId: string) =>
  apiRequest<SimilarityRun>(`/similarity/runs/${encodeURIComponent(runId)}`);
