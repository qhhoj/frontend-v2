import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { problemData } from '@/test/admin-fixtures/problems';
import { fetchProblemData, problemDataFileUrl, putProblemData } from './problem-data.api';

describe('problem data api', () => {
  it('GETs the configuration of the problem', async () => {
    const calls = mockApi({ 'GET /problems/hcmus41c/data': ok(problemData()) });
    const data = await fetchProblemData('hcmus41c');
    expect(calls[0]?.path).toBe('/problems/hcmus41c/data');
    expect(data.archive).toBe('hcmus41c.zip');
  });

  it('PUTs the body unchanged and reads the saved configuration from the answer', async () => {
    const saved = problemData({ unicode: true });
    const calls = mockApi({ 'PUT /problems/hcmus41c/data': ok(saved) });
    const body = { ...saved, cases: saved.cases };
    const answer = await putProblemData('hcmus41c', body);
    expect(calls[0]?.body).toEqual(body);
    expect(answer.unicode).toBe(true);
  });

  it('links an archive file with its name escaped, so a path inside the archive stays one segment', () => {
    expect(problemDataFileUrl('a b', 'sub1/01.in')).toBe(
      '/api/internal/problems/a%20b/data/files/sub1%2F01.in',
    );
  });
});
