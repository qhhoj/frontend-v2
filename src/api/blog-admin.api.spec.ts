import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import { fetchModerationPosts, hidePost, showPost } from './blog-admin.api';

describe('blog moderation calls', () => {
  it('hides and shows a post by patching visible', async () => {
    const calls = mockApi({ 'PATCH /posts/p%2F1': ok({}) });
    await hidePost('p/1');
    await showPost('p/1');
    expect(calls.map((call) => call.body)).toEqual([{ visible: false }, { visible: true }]);
  });

  it('lists the moderation queue by state and page', async () => {
    const calls = mockApi({ 'GET /admin/posts': page([]) });
    await fetchModerationPosts('scheduled', 3);
    expect([calls[0]!.query.get('state'), calls[0]!.query.get('page')]).toEqual(['scheduled', '3']);
  });
});
