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
  it('shows no comments tab and the not-found page to a viewer without the right, with no comments request', async () => {
    const calls = mockApi({ ...signedInViewer(), ...base });
    const { wrapper, router } = await mountApp('/users/user_01/comments');
    expect(router.currentRoute.value.name).toBe('not-found');
    expect(router.currentRoute.value.path).toBe('/users/user_01/comments');
    expect(calls.some((call) => call.path.endsWith('/comments'))).toBe(false);
    await router.push('/users/user_01');
    await flushPromises();
    expect(wrapper.find('a[href="/users/user_01/comments"]').exists()).toBe(false);
  });
  it('keeps the comments behind not-found when the session cannot be read', async () => {
    const calls = mockApi({ ...base, 'GET /auth/me': fail(500, 'internal') });
    const { router } = await mountApp('/users/user_01/comments');
    expect(router.currentRoute.value.name).toBe('not-found');
    expect(calls.some((call) => call.path.endsWith('/comments'))).toBe(false);
  });
  it('links "Bài nộp" to the site list filtered to the user, with their count', async () => {
    const calls = mockApi({ ...anonymousViewer, ...base });
    const { wrapper } = await mountApp('/users/user_01');
    await flushPromises();
    const tab = wrapper.get('a[href="/submissions?user=user_01"]');
    expect(tab.text()).toContain('Bài nộp');
    expect(tab.get('[data-testid="tab-badge"]').text()).toContain('38');
    // The count comes with the user page: no list request of its own.
    expect(calls.some((call) => call.path === '/submissions')).toBe(false);
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
  it('shows a signed-out visitor the not-found page for the comments, with no comments request', async () => {
    const calls = mockApi({ ...anonymousViewer, ...base });
    const { router } = await mountApp('/users/user_01/comments');
    expect(router.currentRoute.value.name).toBe('not-found');
    expect(calls.some((call) => call.path.endsWith('/comments'))).toBe(false);
  });
  it('says so when the server refuses a staff viewer the comments', async () => {
    const viewer = signedInViewer({
      user: sessionUser({ permissions: ['judge.view_all_user_comment'] }),
    });
    mockApi({ ...viewer, ...base, 'GET /users/user_01/comments': fail(403, 'forbidden') });
    const { wrapper } = await mountApp('/users/user_01/comments');
    await flushPromises();
    expect(wrapper.get('[data-state="forbidden"]').text()).toContain(
      'Bạn không có quyền xem bình luận của người dùng này',
    );
    expect(wrapper.find('[data-state="forbidden"] button').exists()).toBe(false);
  });
});
