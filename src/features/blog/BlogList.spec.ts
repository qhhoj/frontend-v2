import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { VoteScore } from '@/api/types/votes';
import { postItem } from '@/test/community-fixtures';
import { communityHomeRoutes } from '@/test/community-routes';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const OWN_AUTHOR_ID = '0192a000-0000-7000-8000-000000000001';
const UP = 'button[aria-label="Bình chọn lên"]';

describe('blog list: feed, pages and links', () => {
  it('reads the feed and page from the URL, pins sticky posts with a label and links each post', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...communityHomeRoutes,
      'GET /posts': page(
        [
          postItem({ sticky: true, title: 'Thông báo' }),
          postItem({ id: 'p2', title: 'Mẹo tối ưu' }),
        ],
        { pageSize: 10, total: 140, page: 2 },
      ),
    });
    const { wrapper } = await mountApp('/blog?feed=all&page=2');
    const request = calls.find((call) => call.path === '/posts')!;
    expect([request.query.get('feed'), request.query.get('page')]).toEqual(['all', '2']);
    const pinned = wrapper.get('[data-testid="post-card"]');
    expect(pinned.text()).toContain('Đã ghim');
    expect(pinned.get('h2 a').text()).toBe('Thông báo');
    const rows = wrapper.findAll('[data-testid="post-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.get('h2 a').attributes('href')).toBe('/blog/p2');
    expect(wrapper.get('a[aria-current="page"][href="/blog?feed=all"]').text()).toBe(
      'Tất cả bài viết',
    );
    expect(wrapper.find('nav[aria-label="Trang bài viết"]').exists()).toBe(true);
  });
});

describe('blog list: votes', () => {
  it('lets a signed-in reader vote, shows the new score and pressed state, and refreshes the list', async () => {
    let vote: { score: number; viewerVote: VoteScore } = { score: 58, viewerVote: 0 };
    const calls = mockApi({
      ...signedInViewer(),
      ...communityHomeRoutes,
      'GET /posts/drafts': page([]),
      'GET /posts': () => page([postItem({ ...vote })]),
      [`PUT /posts/${postItem().id}/vote`]: ({ body }) => {
        const { score } = body as { score: VoteScore };
        vote = { score: 58 + score, viewerVote: score };
        return ok(vote);
      },
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get(`[data-testid="post-row"] ${UP}`).trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')!.body).toEqual({ score: 1 });
    expect(wrapper.get('[data-testid="vote-score"]').text()).toBe('59');
    expect(wrapper.get(UP).attributes('aria-pressed')).toBe('true');
    expect(calls.filter((call) => call.path === '/posts')).toHaveLength(2);
  });
});

describe('blog list: inert arrows', () => {
  it('keeps the arrows of the viewer’s own post inert: a press sends nothing', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...communityHomeRoutes,
      'GET /posts/drafts': page([]),
      'GET /posts': page([
        postItem({ authors: [{ id: OWN_AUTHOR_ID, username: 'user_01', rating: null }] }),
      ]),
    });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get(UP).attributes('aria-disabled')).toBe('true');
    await wrapper.get(UP).trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });
  it('keeps a guest’s arrows inert: a press sends nothing', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...communityHomeRoutes,
      'GET /posts': page([postItem()]),
    });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get(UP).attributes('aria-disabled')).toBe('true');
    await wrapper.get(UP).trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });
});
