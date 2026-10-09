import { describe, expect, it } from 'vitest';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import { ORG_PROBLEMS, TAGS, bulkResult } from '@/test/f4-fixtures';
import {
  ORG_PROBLEM_PAGE_SIZE,
  TAG_PAGE_SIZE,
  archiveProblem,
  createProblemTag,
  deleteProblemTag,
  fetchArchivedIn,
  fetchOrganizationProblems,
  fetchProblemTags,
  runBulk,
  setProblemTags,
  unarchiveProblem,
  updateProblemTag,
} from './organization-problems.api';

describe('organization problems api', () => {
  it('lists problems with the filter as query parameters', async () => {
    const calls = mockApi({ 'GET /organizations/lhp/problems': page(ORG_PROBLEMS) });
    await fetchOrganizationProblems('lhp', {
      tag: 'dt',
      archived: 'all',
      q: 'cây',
      page: 2,
      pageSize: ORG_PROBLEM_PAGE_SIZE,
    });
    const query = calls[0]!.query;
    expect([query.get('tag'), query.get('archived'), query.get('q'), query.get('page')]).toEqual([
      'dt',
      'all',
      'cây',
      '2',
    ]);
  });

  it('reads the whole tag catalogue in one page', async () => {
    const calls = mockApi({ 'GET /organizations/lhp/problem-tags': page(TAGS) });
    expect((await fetchProblemTags('lhp')).items).toHaveLength(TAGS.length);
    expect(calls[0]!.query.get('pageSize')).toBe(String(TAG_PAGE_SIZE));
  });

  it('creates, renames and deletes a tag by its slug', async () => {
    const calls = mockApi({
      'POST /organizations/lhp/problem-tags': { status: 201, body: { data: TAGS[0] } },
      'PATCH /organizations/lhp/problem-tags/qhd': ok(TAGS[0]),
      'DELETE /organizations/lhp/problem-tags/qhd': noContent(),
    });
    await createProblemTag('lhp', { slug: 'qhd', name: 'Quy hoạch động', color: 'tag-1' });
    await updateProblemTag('lhp', 'qhd', { name: 'QHĐ' });
    await deleteProblemTag('lhp', 'qhd');
    expect(calls.map((call) => [call.method, call.body])).toEqual([
      ['POST', { slug: 'qhd', name: 'Quy hoạch động', color: 'tag-1' }],
      ['PATCH', { name: 'QHĐ' }],
      ['DELETE', undefined],
    ]);
  });

  it('puts tag ids on a problem and archives or unarchives it', async () => {
    const calls = mockApi({
      'PUT /organizations/lhp/problems/lhp_sp/tags': ok(ORG_PROBLEMS[2]),
      'POST /organizations/lhp/problems/lhp_sp/archive': noContent(),
      'DELETE /organizations/lhp/problems/lhp_sp/archive': noContent(),
    });
    await setProblemTags('lhp', 'lhp_sp', [TAGS[1]!.id]);
    await archiveProblem('lhp', 'lhp_sp');
    await unarchiveProblem('lhp', 'lhp_sp');
    expect(calls[0]!.body).toEqual({ tagIds: [TAGS[1]!.id] });
    expect(calls.slice(1).map((call) => call.method)).toEqual(['POST', 'DELETE']);
  });

  it('sends a bulk action with its codes and returns the per-code results', async () => {
    const answer = bulkResult([
      ['lhp_sp', 'done'],
      ['lhp_old', 'skipped'],
    ]);
    const calls = mockApi({ 'POST /organizations/lhp/problems/bulk': ok(answer) });
    const result = await runBulk('lhp', { codes: ['lhp_sp', 'lhp_old'], action: 'archive' });
    expect(calls[0]!.body).toEqual({ codes: ['lhp_sp', 'lhp_old'], action: 'archive' });
    expect([result.done, result.skipped]).toEqual([1, 1]);
  });

  it('asks where the viewer sees a problem archived', async () => {
    const calls = mockApi({
      'GET /problems/caitui/archived-in': ok({ organizations: [{ slug: 'lhp', name: 'LHP' }] }),
    });
    expect((await fetchArchivedIn('caitui')).organizations).toHaveLength(1);
    expect(calls[0]!.method).toBe('GET');
  });
});
