import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { VoteScore } from '@/api/types/votes';
import { VIEWER, postDetail } from '@/test/community-fixtures';
import { postRoutes } from '@/test/community-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const UP = 'button[aria-label="Bình chọn lên"]';

describe('blog post: votes', () => {
  it('disables the arrows for an anonymous viewer', async () => {
    mockApi({ ...anonymousViewer, ...postRoutes() });
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    expect(wrapper.get(`[data-testid="post-actions"] ${UP}`).attributes('aria-disabled')).toBe(
      'true',
    );
  });
  it('disables the arrows for the author of the post', async () => {
    mockApi({
      ...signedInViewer(),
      ...postRoutes(postDetail({ authors: [VIEWER] })),
    });
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    expect(wrapper.get(`[data-testid="post-actions"] ${UP}`).attributes('aria-disabled')).toBe(
      'true',
    );
  });
  it('lets a signed-in non-author vote, shows the new score and refetches the post', async () => {
    let vote: { score: number; viewerVote: VoteScore } = { score: 58, viewerVote: 0 };
    const detail = postDetail();
    const calls = mockApi({
      ...signedInViewer(),
      ...postRoutes(detail),
      [`GET /posts/${detail.id}`]: () => ok({ ...detail, ...vote }),
      [`PUT /posts/${detail.id}/vote`]: ({ body }) => {
        const { score } = body as { score: VoteScore };
        vote = { score: 58 + score, viewerVote: score };
        return ok(vote);
      },
    });
    const { wrapper } = await mountApp(`/blog/${detail.id}`);
    await wrapper.get(`[data-testid="post-actions"] ${UP}`).trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')!.body).toEqual({ score: 1 });
    expect(wrapper.get('[data-testid="vote-score"]').text()).toBe('59');
    expect(calls.filter((call) => call.path === `/posts/${detail.id}`)).toHaveLength(2);
  });
});
