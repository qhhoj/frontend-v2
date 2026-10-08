import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { postItem } from '@/test/community-fixtures';
import { communityHomeRoutes } from '@/test/community-routes';
import { hangRequestsExcept, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const OWN_AUTHOR_ID = '0192a000-0000-7000-8000-000000000001';

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
    const rows = wrapper.findAll('[data-testid="post-row"]');
    expect(rows[0]!.text()).toContain('Ghim');
    expect(rows[1]!.get('h2 a').attributes('href')).toBe('/blog/p2');
    expect(wrapper.get('a[aria-current="page"][href="/blog?feed=all"]').text()).toBe(
      'Tất cả bài viết',
    );
    expect(wrapper.find('nav[aria-label="Trang bài viết"]').exists()).toBe(true);
  });
  it('shows the write button to signed-in readers only and the RSS link to everyone', async () => {
    mockApi({ ...anonymousViewer, ...communityHomeRoutes, 'GET /posts': page([postItem()]) });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.find('a[href="/blog/new"]').exists()).toBe(false);
    expect(wrapper.get('a[aria-label="Nguồn RSS"]').attributes('href')).toBe(
      '/api/internal/feeds/blog/rss',
    );
  });
});

describe('blog list: votes', () => {
  it('lets a signed-in reader vote and refreshes the list', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...communityHomeRoutes,
      'GET /posts': page([postItem()]),
      [`PUT /posts/${postItem().id}/vote`]: ok({ score: 59, viewerVote: 1 }),
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper
      .get('[data-testid="post-row"] button[aria-label="Bình chọn lên"]')
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')!.body).toEqual({ score: 1 });
    expect(calls.filter((call) => call.path === '/posts')).toHaveLength(2);
  });
  it('keeps the arrows of the viewer’s own post inert', async () => {
    mockApi({
      ...signedInViewer(),
      ...communityHomeRoutes,
      'GET /posts': page([postItem({ authors: [{ id: OWN_AUTHOR_ID, username: 'user_01' }] })]),
    });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get('button[aria-label="Bình chọn lên"]').attributes('aria-disabled')).toBe(
      'true',
    );
  });
  it('keeps a guest’s arrows inert', async () => {
    mockApi({ ...anonymousViewer, ...communityHomeRoutes, 'GET /posts': page([postItem()]) });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get('button[aria-label="Bình chọn lên"]').attributes('aria-disabled')).toBe(
      'true',
    );
  });
});

describe('blog list: states', () => {
  it('shows the Bit pair on an empty feed', async () => {
    mockApi({ ...anonymousViewer, ...communityHomeRoutes, 'GET /posts': page([]) });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get('[data-state="communityEmpty"]').text()).toContain('Chưa có bài viết nào');
  });
  it('shows post-shaped blocks while loading', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.findAll('[data-skeleton-region="post-row"]')).toHaveLength(6);
  });
});
