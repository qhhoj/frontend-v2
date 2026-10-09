import { describe, expect, it } from 'vitest';
import { SCRATCH_ID, submissionStats } from '@/test/fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  fetchSubmission,
  fetchSubmissionSource,
  fetchSubmissions,
  fetchSubmissionStats,
  submit,
  submitFile,
} from './submissions.api';

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

describe('submission list, detail and submit', () => {
  it('repeats array filters in the list query and paginates', async () => {
    const calls = mockApi({ 'GET /submissions': page([]) });
    await fetchSubmissions({
      user: 'u',
      problem: 'p',
      page: 2,
      language: ['a', 'b'],
      result: ['AC', 'WA'],
      status: ['QU'],
    });
    const { query } = calls[0]!;
    expect(query.get('user')).toBe('u');
    expect(query.get('problem')).toBe('p');
    expect(query.get('page')).toBe('2');
    expect(query.getAll('language')).toEqual(['a', 'b']);
    expect(query.getAll('result')).toEqual(['AC', 'WA']);
    expect(query.getAll('status')).toEqual(['QU']);
  });

  it('reads one submission by its encoded id', async () => {
    const calls = mockApi({ 'GET /submissions/s%2F1': ok({ id: 's/1' }) });
    await fetchSubmission('s/1');
    expect(calls[0]!.path).toBe('/submissions/s%2F1');
  });

  it('posts the JSON source to the encoded problem code', async () => {
    const calls = mockApi({ 'POST /problems/a%2Fb/submit': ok({ id: 's1' }) });
    await expect(submit('a/b', { language: 'L', source: 'x' })).resolves.toEqual({ id: 's1' });
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.body).toEqual({ language: 'L', source: 'x' });
  });
});
