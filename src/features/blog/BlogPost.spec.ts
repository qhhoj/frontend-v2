import { describe, expect, it } from 'vitest';
import { postDetail, organizationSummary } from '@/test/community-fixtures';
import { postRoutes } from '@/test/community-routes';
import { fail, hangRequestsExcept, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

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
