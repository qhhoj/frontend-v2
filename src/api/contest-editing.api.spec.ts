import { describe, expect, it } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import { editableContest } from '@/test/admin-fixtures/contests';
import { fetchOfficialRanking, fetchRankingLink, updateContest } from './contest-editing.api';

describe('contest editing API', () => {
  it('keeps an explicit null in a PATCH body, so a cleared nullable field reaches the backend', async () => {
    const calls = mockApi({ 'PATCH /contests/hcmus-w41': ok(editableContest()) });
    await updateContest('hcmus-w41', { timeLimit: null });
    expect(calls[0]!.body).toEqual({ timeLimit: null });
  });

  it('reads a missing official ranking or ranking link (404) as null', async () => {
    mockApi({
      'GET /contests/k1/official-ranking': fail(404, 'not_found'),
      'GET /contests/k1/ranking-link': fail(404, 'not_found'),
    });
    await expect(fetchOfficialRanking('k1')).resolves.toBeNull();
    await expect(fetchRankingLink('k1')).resolves.toBeNull();
  });
});
