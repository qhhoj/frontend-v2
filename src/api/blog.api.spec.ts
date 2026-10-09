import { describe, expect, it } from 'vitest';
import { postDetail, postItem } from '@/test/community-fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import { fetchPost, fetchPosts, votePost } from './blog.api';

describe('blog calls', () => {
  it('lists a feed page with the feed and page number as the query', async () => {
    const calls = mockApi({ 'GET /posts': page([postItem()]) });
    await fetchPosts('global', 2);
    expect(calls[0]!.query.get('feed')).toBe('global');
    expect(calls[0]!.query.get('page')).toBe('2');
  });

  it('reads a post by its encoded id and votes with the score as the body', async () => {
    const calls = mockApi({
      'GET /posts/p%2F1': ok(postDetail()),
      'PUT /posts/p%2F1/vote': ok({ score: 1, viewerVote: 1 }),
    });
    await fetchPost('p/1');
    await votePost('p/1', 1);
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /posts/p%2F1',
      'PUT /posts/p%2F1/vote',
    ]);
    expect(calls[1]!.body).toEqual({ score: 1 });
  });
});
