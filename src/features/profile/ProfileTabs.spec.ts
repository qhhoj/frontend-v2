import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { ppEntry, recentComment } from '@/test/community-fixtures';
import { profileRoutes, profileTabRoutes } from '@/test/community-routes';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const base = { ...profileRoutes(), ...profileTabRoutes() };

describe('profile tabs', () => {
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
});
