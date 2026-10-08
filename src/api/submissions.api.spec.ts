import { describe, expect, it } from 'vitest';
import { SCRATCH_ID, submissionStats } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { fetchSubmissionSource, fetchSubmissionStats, submitFile } from './submissions.api';

describe('file submission (B17)', () => {
  it('sends multipart with the language id and the file, never JSON', async () => {
    const calls = mockApi({ 'POST /problems/catmaze/submit/file': ok({ id: 's1' }) });
    const file = new File(['sb3 bytes'], 'catmaze-final.sb3');
    await expect(submitFile('catmaze', { language: SCRATCH_ID, file })).resolves.toEqual({
      id: 's1',
    });
    const body = calls[0]!.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('language')).toBe(SCRATCH_ID);
    expect((body.get('file') as File).name).toBe('catmaze-final.sb3');
    expect(calls[0]!.headers.get('Content-Type')).toBeNull();
  });
});
describe('submission stats (B24)', () => {
  it('reads the five aggregate numbers of the stats strip', async () => {
    mockApi({ 'GET /submissions/stats': ok(submissionStats()) });
    expect(await fetchSubmissionStats()).toEqual(submissionStats());
  });
});
describe('submission source', () => {
  it('reads the source of one submission by id', async () => {
    const calls = mockApi({
      'GET /submissions/s1/source': ok({ id: 's1', source: 'int main() {}' }),
    });
    await expect(fetchSubmissionSource('s1')).resolves.toEqual({
      id: 's1',
      source: 'int main() {}',
    });
    expect(calls[0]!.path).toBe('/submissions/s1/source');
  });
});
