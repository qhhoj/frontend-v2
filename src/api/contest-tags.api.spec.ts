import { describe, expect, it } from 'vitest';
import { contestTag } from '@/test/contest-extras-fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  createContestTag,
  deleteContestTag,
  fetchContestTags,
  updateContestTag,
} from './contest-tags.api';

describe('contest tag catalogue calls', () => {
  it('reads the whole catalogue as one page of 100 and returns its items', async () => {
    const calls = mockApi({ 'GET /contest-tags': page([contestTag()]) });
    const tags = await fetchContestTags();
    const [call] = calls.filter((seen) => seen.path === '/contest-tags');
    expect(call!.query.get('page')).toBe('1');
    expect(call!.query.get('pageSize')).toBe('100');
    expect(tags.map((tag) => tag.slug)).toEqual(['quoc-gia']);
  });

  it('creates, patches and deletes by slug with the slug encoded', async () => {
    const calls = mockApi({
      'POST /contest-tags': ok(contestTag()),
      'PATCH /contest-tags/quoc-gia': ok(contestTag({ name: 'QG' })),
      'DELETE /contest-tags/quoc-gia': noContent(),
    });
    await createContestTag({ slug: 'quoc-gia', name: 'Quốc gia', color: 'tag-5' });
    await updateContestTag('quoc-gia', { name: 'QG' });
    await expect(deleteContestTag('quoc-gia')).resolves.toBeUndefined();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'POST /contest-tags',
      'PATCH /contest-tags/quoc-gia',
      'DELETE /contest-tags/quoc-gia',
    ]);
    expect(calls[0]!.body).toEqual({ slug: 'quoc-gia', name: 'Quốc gia', color: 'tag-5' });
    expect(calls[1]!.body).toEqual({ name: 'QG' });
  });
});
