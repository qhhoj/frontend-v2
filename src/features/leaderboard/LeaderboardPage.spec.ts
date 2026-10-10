import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { leaderboardEntry, userPage } from '@/test/fixtures';
import { organizationSummary } from '@/test/community-fixtures';
import { fail, hangRequestsExcept, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

const board = page(
  [
    {
      ...leaderboardEntry(1133, 'dinhphuc', 1488),
      organization: organizationSummary({ shortName: 'PBC' }),
    },
    leaderboardEntry(1134, 'user_01', 1487),
  ],
  { page: 12, pageSize: 100, total: 4562 },
);

/** jsdom has no scrollIntoView: each test gets a mock, and the original (absent) method is put back after it. */
let scrollIntoView: Mock;
const originalScrollIntoView = Reflect.get(Element.prototype, 'scrollIntoView') as unknown;
beforeEach(() => {
  scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
  Object.assign(Element.prototype, { scrollIntoView: originalScrollIntoView });
});

describe('leaderboard page: reads the board from the URL', () => {
  it('reads sort and page from the URL, asks the API for them and shows rows with avatar, tier colour and school', async () => {
    const calls = mockApi({ ...anonymousViewer, 'GET /users': board });
    const { wrapper } = await mountApp('/users?sort=points&page=12');
    const request = calls.find((call) => call.path === '/users')!;
    expect([request.query.get('sort'), request.query.get('page')]).toEqual(['points', '12']);
    const row = wrapper.get('#user-dinhphuc');
    expect(row.findComponent(UserAvatar).exists()).toBe(true);
    expect(row.get('a[href="/users/dinhphuc"]').classes()).toContain('text-tier-specialist');
    expect(row.text()).toContain('PBC');
    expect(wrapper.get('th[aria-sort="descending"]').text()).toBe('Tổng điểm');
    expect(wrapper.findAll('th[aria-sort="none"]')).toHaveLength(3);
  });

  it('sorts by a clicked column heading and returns to the first page', async () => {
    const calls = mockApi({ ...anonymousViewer, 'GET /users': board });
    const { wrapper, router } = await mountApp('/users?sort=points&page=12');
    const button = wrapper
      .findAll('thead th button')
      .find((candidate) => candidate.text() === 'Số bài giải')!;
    await button.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/users?sort=problemCount');
    expect(
      calls
        .filter((call) => call.path === '/users')
        .at(-1)!
        .query.get('page'),
    ).toBe('1');
    expect(wrapper.get('th[aria-sort="descending"]').text()).toBe('Số bài giải');
  });
});

describe('leaderboard page: shows the viewer’s own rank', () => {
  it('marks the viewer’s row and jumps to the page that holds it', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'GET /users': board,
      'GET /users/user_01': ok(userPage({ rating: 1487 })),
      'GET /users/user_01/rank': ok({ rank: 1134, page: 12, pageSize: 100 }),
    });
    const { wrapper, router } = await mountApp('/users');
    const card = wrapper.get('[data-testid="my-rank"]');
    expect(card.text()).toContain('1.134');
    expect(card.text()).toContain('Specialist');
    await card.get('button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/users?page=12#user-user_01');
    expect(calls.filter((call) => call.path === '/users/user_01/rank')[0]!.query.get('sort')).toBe(
      'rating',
    );
    expect(wrapper.get('#user-user_01').text()).toContain('Bạn');
  });

  it('says an unlisted account is not on the board instead of failing', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /users': board,
      'GET /users/user_01': ok(userPage()),
      'GET /users/user_01/rank': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/users');
    expect(wrapper.get('[data-testid="my-rank"]').text()).toContain(
      'Tài khoản của bạn không có trên bảng xếp hạng',
    );
  });
});

describe('leaderboard page: opens a profile by username', () => {
  it('opens a profile by exact username', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /users': board,
      'GET /users/khoa.tran': ok(userPage({ username: 'khoa.tran' })),
      'GET /users/khoa.tran/ratings': ok([]),
      'GET /users/khoa.tran/activity': ok({ timezone: 'UTC', since: '2026-01-01', days: {} }),
      'GET /users/khoa.tran/solved': ok({ groups: [] }),
      'GET /users/khoa.tran/comments': page([], { pageSize: 10, nextBefore: null }),
    });
    const { wrapper, router } = await mountApp('/users');
    await wrapper.get('input[name="username"]').setValue('  khoa.tran ');
    await wrapper.get('form[data-testid="username-jump"]').trigger('submit');
    // The profile route is a lazy chunk: the push settles after a few ticks, not one flush.
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/users/khoa.tran'));
  });

  it('does not navigate when the username box is blank', async () => {
    mockApi({ ...anonymousViewer, 'GET /users': board });
    const { wrapper, router } = await mountApp('/users');
    const push = vi.spyOn(router, 'push');
    await wrapper.get('input[name="username"]').setValue('   ');
    await wrapper.get('form[data-testid="username-jump"]').trigger('submit');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('leaderboard page: loading and empty boards', () => {
  it('shows a table skeleton with the header and one viewport of rows (not a page of 100) while loading, inert', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/users');
    const skeleton = wrapper.get('[data-testid="query-skeleton"]');
    expect(skeleton.findAll('tbody tr')).toHaveLength(12);
    expect(skeleton.findAll('thead th')).toHaveLength(7);
    expect(skeleton.text().trim()).toBe('');
  });

  it('shows the Bit pair on an empty board and a decorative trophy beside ranks 1 to 3 only', async () => {
    mockApi({ ...anonymousViewer, 'GET /users': page([]) });
    const { wrapper } = await mountApp('/users');
    expect(wrapper.get('[data-state="communityEmpty"]').text()).toContain(
      'Chưa có ai trên bảng xếp hạng này',
    );
    mockApi({
      ...anonymousViewer,
      'GET /users': page([leaderboardEntry(1, 'a', 3000), leaderboardEntry(4, 'b', 2000)]),
    });
    const { wrapper: top } = await mountApp('/users');
    expect(top.findAll('[data-bit-variant="rankUp"]')).toHaveLength(1);
    expect(top.find('[data-bit-variant="rankUp"] [aria-hidden="true"]').exists()).toBe(true);
  });
});

describe('leaderboard page: find-my-rank again and errors', () => {
  it('reveals and focuses the viewer row again when the board is already on that page', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /users': board,
      'GET /users/user_01': ok(userPage({ rating: 1487 })),
      'GET /users/user_01/rank': ok({ rank: 1134, page: 12, pageSize: 100 }),
    });
    const { wrapper } = await mountApp('/users');
    await wrapper.get('[data-testid="my-rank"] button').trigger('click');
    await flushPromises();
    (document.activeElement as HTMLElement | null)?.blur();
    scrollIntoView.mockClear();
    await wrapper.get('[data-testid="my-rank"] button').trigger('click');
    await flushPromises();
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('user-user_01');
  });

  it('shows the query error with a retry in the rank card when the rank request fails', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /users': board,
      'GET /users/user_01': ok(userPage()),
      'GET /users/user_01/rank': fail(500, 'internal_error'),
    });
    const { wrapper } = await mountApp('/users');
    const card = wrapper.get('[data-testid="my-rank"]');
    expect(card.find('[role="alert"]').exists()).toBe(true);
    expect(card.text()).toContain('Thử lại');
    expect(card.text()).not.toContain('Tài khoản của bạn không có trên bảng xếp hạng');
  });
});
