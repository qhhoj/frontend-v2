import { describe, expect, it } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  fetchEditorial,
  fetchProblem,
  fetchProblemMeta,
  fetchProblems,
  problemPdfUrl,
} from './problems.api';

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
  it('lists problems with the page, language, repeated type ids and sort in the query', async () => {
    const calls = mockApi({ 'GET /problems': page([]) });
    await fetchProblems({
      page: 2,
      pageSize: 50,
      lang: 'vi',
      search: 'sum',
      typeIds: ['t1', 't2'],
      pointsMin: 100,
      sort: '-acRate',
    });
    expect(calls[0]!.path).toBe('/problems');
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('lang')).toBe('vi');
    expect(calls[0]!.query.get('sort')).toBe('-acRate');
    expect(calls[0]!.query.getAll('typeIds')).toEqual(['t1', 't2']);
  });
  it('reads the catalogue for the filters', async () => {
    const calls = mockApi({ 'GET /problems/meta': ok({ types: [], groups: [], languages: [] }) });
    await fetchProblemMeta();
    expect(calls[0]!.path).toBe('/problems/meta');
  });
});
