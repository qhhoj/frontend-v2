import { describe, expect, it } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { fetchEditorial, fetchProblem, problemPdfUrl } from './problems.api';

describe('problem detail', () => {
  it('asks for the detail in the given statement language and encodes the code', async () => {
    const calls = mockApi({ 'GET /problems/a%2Fb': ok(problemDetail()) });
    await fetchProblem('a/b', 'en');
    expect(calls[0]!.query.get('lang')).toBe('en');
    expect(calls[0]!.path).toBe('/problems/a%2Fb');
  });
  it('asks for the editorial in the statement language', async () => {
    const calls = mockApi({ 'GET /problems/aplusb/editorial': ok({ contentHtml: '<p>x</p>' }) });
    await fetchEditorial('aplusb', 'vi');
    expect(calls[0]!.path).toBe('/problems/aplusb/editorial');
    expect(calls[0]!.query.get('lang')).toBe('vi');
  });
  it('points the PDF request at one path segment for the code, with the language', async () => {
    const calls = mockApi({ 'GET /problems/a%2Fb/pdf': ok({ status: 'ready' }) });
    await fetch(problemPdfUrl('a/b', 'en'));
    expect(calls[0]!.path).toBe('/problems/a%2Fb/pdf');
    expect(calls[0]!.query.get('lang')).toBe('en');
  });
});
