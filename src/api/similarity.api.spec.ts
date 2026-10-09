import { describe, expect, it } from 'vitest';
import {
  similarityPair,
  similarityPairDetail,
  similarityRun,
} from '@/test/admin-fixtures/similarity';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  fetchSimilarityPair,
  fetchSimilarityPairs,
  fetchSimilarityRun,
  fetchSimilarityRuns,
  SIMILARITY_PAIRS_PAGE_SIZE,
  startSimilarityRun,
} from './similarity.api';

describe('similarity calls', () => {
  it('starts a run with the scope as the body', async () => {
    const calls = mockApi({ 'POST /similarity/runs': ok({ runId: 'r1' }) });
    await expect(startSimilarityRun({ contest: 'c1' })).resolves.toEqual({ runId: 'r1' });
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.body).toEqual({ contest: 'c1' });
  });

  it('lists the runs of a scope through the query', async () => {
    const calls = mockApi({ 'GET /similarity/runs': ok([similarityRun()]) });
    await fetchSimilarityRuns({ problem: 'p1' });
    expect(calls[0]!.path).toBe('/similarity/runs');
    expect(calls[0]!.query.get('problem')).toBe('p1');
    expect(calls[0]!.query.has('contest')).toBe(false);
  });

  it('reads one run and one pair by their encoded ids', async () => {
    const calls = mockApi({
      'GET /similarity/runs/a%2Fb': ok(similarityRun()),
      'GET /similarity/pairs/c%2Fd': ok(similarityPairDetail()),
    });
    await fetchSimilarityRun('a/b');
    await fetchSimilarityPair('c/d');
    expect(calls.map((call) => call.path)).toEqual([
      '/similarity/runs/a%2Fb',
      '/similarity/pairs/c%2Fd',
    ]);
  });

  it('pages the pairs of a run with the filters and the fixed page size', async () => {
    const calls = mockApi({ 'GET /similarity/runs/r1/pairs': page([similarityPair()]) });
    await fetchSimilarityPairs('r1', {
      problemId: 'p1',
      language: 'cpp',
      minSimilarity: 0.8,
      page: 2,
    });
    const { query } = calls[0]!;
    expect(calls[0]!.path).toBe('/similarity/runs/r1/pairs');
    expect(query.get('problemId')).toBe('p1');
    expect(query.get('language')).toBe('cpp');
    expect(query.get('minSimilarity')).toBe('0.8');
    expect(query.get('page')).toBe('2');
    expect(query.get('pageSize')).toBe(String(SIMILARITY_PAIRS_PAGE_SIZE));
  });
});
