import { describe, expect, it } from 'vitest';
import { mockApi, noContent, page } from '@/test/mock-api';
import { deletedProblem } from '@/test/f4-fixtures';
import {
  DELETED_PAGE_SIZE,
  deleteProblem,
  fetchDeletedProblems,
  purgeProblemNow,
  restoreProblem,
} from './problem-lifecycle.api';

describe('problem lifecycle api', () => {
  it('reads one page of deleted problems with the fixed page size', async () => {
    const calls = mockApi({ 'GET /problems/deleted': page([deletedProblem()]) });
    const answer = await fetchDeletedProblems(3);
    expect(calls[0]!.query.get('page')).toBe('3');
    expect(calls[0]!.query.get('pageSize')).toBe(String(DELETED_PAGE_SIZE));
    expect(answer.items.map((row) => row.code)).toEqual(['cuvui']);
  });

  it('deletes with the typed confirm code in the body and escapes the code in the path', async () => {
    const calls = mockApi({ 'DELETE /problems/a%20b': noContent() });
    await expect(deleteProblem('a b', 'a b')).resolves.toBeUndefined();
    expect(calls[0]!.method).toBe('DELETE');
    expect(calls[0]!.body).toEqual({ confirmCode: 'a b' });
  });

  it('restores without a body and purges with the confirm code', async () => {
    const calls = mockApi({
      'POST /problems/cuvui/restore': noContent(),
      'POST /problems/cuvui/purge-now': { status: 202, body: { data: { queued: true } } },
    });
    await restoreProblem('cuvui');
    const purge = await purgeProblemNow('cuvui', 'cuvui');
    expect(calls[0]!.body).toBeUndefined();
    expect(calls[1]!.body).toEqual({ confirmCode: 'cuvui' });
    expect(purge.queued).toBe(true);
  });
});
