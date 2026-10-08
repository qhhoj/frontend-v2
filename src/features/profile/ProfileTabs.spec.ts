import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { postItem, ppEntry, recentComment } from '@/test/community-fixtures';
import { profileRoutes, profileTabRoutes } from '@/test/community-routes';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const base = { ...profileRoutes(), ...profileTabRoutes() };

describe('profile tabs', () => {
  it('groups solved problems and shows earned of maximum points', async () => {
    mockApi({ ...anonymousViewer, ...base });
    const { wrapper } = await mountApp('/users/user_01/solved');
    const group = wrapper.get('section[aria-labelledby]');
    expect(group.get('h2').text()).toContain('Quy hoạch động');
    expect(group.text()).toContain('2 bài · 140 điểm');
    expect(group.get('a[href="/problems/dp_bit"]').text()).toContain(
      'Quy hoạch trạng thái bitmask',
    );
    expect(group.text()).toContain('70/100');
  });
  it('pages PP entries without a total: a next link only while the server says there is more', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/pp-breakdown': page([ppEntry(1), ppEntry(2)], {
        pageSize: 10,
        total: undefined,
        hasMore: true,
      }),
    });
    const { wrapper } = await mountApp('/users/user_01/pp?page=1');
    expect(
      wrapper.get('nav[aria-label="Trang PP"] a[aria-label="Trang sau"]').attributes('href'),
    ).toBe('/users/user_01/pp?page=2');
    expect(wrapper.text()).toContain('100,0%');
    expect(calls.find((call) => call.path.endsWith('/pp-breakdown'))!.query.get('page')).toBe('1');
  });
  it('shows the sweating Bit with the board’s words when the PP table fails, and retries', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/pp-breakdown': fail(503, 'network_error'),
    });
    const { wrapper } = await mountApp('/users/user_01/pp');
    const state = wrapper.get('[data-state="error"]');
    expect(state.text()).toContain('Không tải được bảng PP');
    await state.get('button').trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.path.endsWith('/pp-breakdown'))).toHaveLength(2);
  });
  it('loads older comments with the cursor the server gave', async () => {
    const viewer = signedInViewer({
      user: sessionUser({ permissions: ['judge.view_all_user_comment'] }),
    });
    const calls = mockApi({
      ...viewer,
      ...base,
      'GET /users/user_01/comments': sequence(
        page([recentComment()], {
          pageSize: 10,
          nextBefore: '0192a000-0000-7000-8000-00000000c0aa',
        }),
        page([recentComment({ id: 'c-old' })], { pageSize: 10, nextBefore: null }),
      ),
    });
    const { wrapper } = await mountApp('/users/user_01/comments');
    await wrapper.get('button[data-testid="older-comments"]').trigger('click');
    await flushPromises();
    const asked = calls
      .filter((call) => call.path.endsWith('/comments'))
      .map((call) => call.query.get('before'));
    expect(asked).toEqual([null, '0192a000-0000-7000-8000-00000000c0aa']);
    expect(wrapper.find('button[data-testid="older-comments"]').exists()).toBe(false);
  });
  it('tells a viewer without the right that the comments tab is closed, with no comments request', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...base,
      'GET /users/user_01/comments': fail(403, 'forbidden'),
    });
    const { wrapper } = await mountApp('/users/user_01/comments');
    expect(wrapper.get('[data-state="forbidden"]').text()).toContain(
      'Bạn không có quyền xem bình luận của người dùng này',
    );
    expect(calls.some((call) => call.path.endsWith('/comments'))).toBe(false);
  });
  it('shows the PP empty state when no problem counts yet', async () => {
    mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/pp-breakdown': page([], {
        pageSize: 10,
        hasMore: false,
        total: undefined,
      }),
    });
    const { wrapper } = await mountApp('/users/user_01/pp');
    expect(wrapper.text()).toContain('Chưa có bài nào được tính PP.');
    expect(wrapper.find('table').exists()).toBe(false);
  });
  it('gives a full-score chip the accepted tone and a partial one the neutral tone, with one decimal when fractional', async () => {
    mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/solved': ok({
        groups: [
          {
            name: 'Quy hoạch',
            points: 170.5,
            problems: [
              { code: 'full', name: 'Đủ điểm', points: 100, total: 100 },
              { code: 'part', name: 'Một phần', points: 70.5, total: 100 },
            ],
          },
        ],
      }),
    });
    const { wrapper } = await mountApp('/users/user_01/solved');
    const chipOf = (name: string) =>
      wrapper
        .findAll('li')
        .find((row) => row.text().includes(name))!
        .get('span.rounded-pill');
    expect(chipOf('Đủ điểm').classes()).toContain('bg-verdict-ac-bg');
    expect(chipOf('Đủ điểm').text()).toBe('100/100');
    expect(chipOf('Một phần').classes()).toContain('bg-partial-bg-2');
    expect(chipOf('Một phần').classes()).not.toContain('bg-verdict-ac-bg');
    expect(chipOf('Một phần').text()).toBe('70,5/100');
    expect(wrapper.text()).toContain('2 bài · 170,5 điểm');
  });
  it('lists the posts of the requested page with its pager and the post line', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/blog': page([postItem()], { page: 2, pageSize: 10, total: 25 }),
    });
    const { wrapper } = await mountApp('/users/user_01/blog?page=2');
    expect(calls.find((call) => call.path.endsWith('/blog'))!.query.get('page')).toBe('2');
    const article = wrapper.get('article');
    expect(article.get(`a[href="/blog/${postItem().id}"]`).text()).toBe(postItem().title);
    expect(article.text()).toContain('58 điểm · 22 bình luận');
    expect(article.text()).toContain('Từ tập độc lập đến rerooting.');
    expect(
      wrapper
        .get('nav[aria-label="Trang bài viết"] a[aria-label="Trang trước"]')
        .attributes('href'),
    ).toBe('/users/user_01/blog');
    expect(wrapper.get('nav[aria-label="Trang bài viết"] [aria-current="page"]').text()).toBe('2');
  });
  it('shows the posts empty state when the user has written none', async () => {
    mockApi({
      ...anonymousViewer,
      ...base,
      'GET /users/user_01/blog': page([], { pageSize: 10, total: 0 }),
    });
    const { wrapper } = await mountApp('/users/user_01/blog');
    expect(wrapper.text()).toContain('Chưa có bài viết nào.');
  });
  it('asks a signed-out visitor to sign in and sends no comments request', async () => {
    const calls = mockApi({ ...anonymousViewer, ...base });
    const { wrapper } = await mountApp('/users/user_01/comments');
    expect(wrapper.get('[data-state="signIn"]').text()).toContain(
      'Đăng nhập để xem bình luận của người dùng',
    );
    expect(wrapper.get('[data-state="signIn"] a').attributes('href')).toBe(
      '/login?redirect=/users/user_01/comments',
    );
    expect(calls.some((call) => call.path.endsWith('/comments'))).toBe(false);
  });
  it('closes the comments tab when the server refuses a viewer who was allowed', async () => {
    const viewer = signedInViewer({
      user: sessionUser({ permissions: ['judge.view_all_user_comment'] }),
    });
    mockApi({ ...viewer, ...base, 'GET /users/user_01/comments': fail(403, 'forbidden') });
    const { wrapper } = await mountApp('/users/user_01/comments');
    expect(wrapper.get('[data-state="forbidden"]').text()).toContain(
      'Bạn không có quyền xem bình luận của người dùng này',
    );
  });
  it('lists the solved problems of an empty profile as an empty state', async () => {
    mockApi({ ...anonymousViewer, ...base, 'GET /users/user_01/solved': ok({ groups: [] }) });
    const { wrapper } = await mountApp('/users/user_01/solved');
    expect(wrapper.text()).toContain('Chưa giải bài nào.');
    expect(wrapper.find('section[aria-labelledby]').exists()).toBe(false);
  });
});
