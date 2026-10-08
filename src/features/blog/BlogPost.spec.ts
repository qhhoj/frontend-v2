import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { VoteScore } from '@/api/types/votes';
import { VIEWER, organizationSummary, postDetail } from '@/test/community-fixtures';
import { postRoutes } from '@/test/community-routes';
import { fail, hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const UP = 'button[aria-label="Bình chọn lên"]';

describe('blog post', () => {
  it('shows the breadcrumb, title, author line, content, vote and comment count, and names the tab', async () => {
    mockApi({
      ...anonymousViewer,
      ...postRoutes(postDetail({ organization: organizationSummary({ shortName: 'HCMUS' }) })),
    });
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    expect(wrapper.get('nav[aria-label="Đường dẫn"]').text()).toContain('Blog');
    expect(wrapper.get('h1').text()).toBe(postDetail().title);
    expect(wrapper.text()).toContain('1. Bài toán mở đầu');
    expect(wrapper.get('[data-testid="post-actions"]').text()).toContain('22 bình luận');
    expect(wrapper.get('[data-testid="post-header"]').text()).toContain('HCMUS');
    expect(document.title).toContain(postDetail().title);
  });
  it('shows the author card with tier and a profile link, and the author’s other posts without this one', async () => {
    mockApi({ ...anonymousViewer, ...postRoutes() });
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    const author = wrapper.get('[data-testid="author-card"]');
    expect(author.text()).toContain('Grandmaster');
    expect(author.get('a[href="/users/ngoc_anh"]').text()).toBe('Xem hồ sơ');
    const more = wrapper.get('[data-testid="more-posts"]');
    expect(more.findAll('a')).toHaveLength(0);
    expect(more.text()).toContain('Chưa có bài viết khác.');
  });
  it('shows the crying Bit when the post does not exist or is hidden', async () => {
    mockApi({ ...anonymousViewer, 'GET /posts/khong-co': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/blog/khong-co');
    expect(wrapper.get('[data-state="notFound"] h1').text()).toBe('Không tìm thấy bài viết');
  });
  it('shows article-shaped blocks while loading', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp(`/blog/${postDetail().id}`);
    for (const region of ['title', 'byline', 'body'])
      expect(wrapper.find(`[data-skeleton-region="${region}"]`).exists(), region).toBe(true);
  });
});

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
