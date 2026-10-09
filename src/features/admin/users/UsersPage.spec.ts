import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer, superuserViewer } from '@/test/admin-routes';
import { ratingHistory, sessionResponse, sessionUser, userPage } from '@/test/fixtures';
import { homeRoutes } from '@/test/home-routes';
import { staffUser, staffUsers } from '@/test/admin-fixtures/users';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import { useSessionStore } from '@/stores/session.store';

const target = userPage({
  username: 'tuan_k',
  displayRank: 'user',
  staff: { isSuperuser: false, isActive: true, banReason: null },
});
/** The admin shell is an async component: the page is there once its heading renders, and its first list answer after that. */
const mountUsers = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('h1').exists()).toBe(true));
  await flushPromises();
  return mounted;
};
const routes = (viewer = staffViewer(['judge.ban_user']), extra = {}) => ({
  ...viewer,
  'GET /admin/users': page(
    [
      staffUser(),
      staffUser({ id: 'u-2', username: 'spammer', displayRank: 'banned', banReason: 'Spam blog' }),
    ],
    { total: 2 },
  ),
  'GET /users/tuan_k': ok(target),
  ...extra,
});
const click = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};

describe('UsersPage', () => {
  it('names a rank in words and announces the result count in the search box live region', async () => {
    mockApi(routes());
    const { wrapper } = await mountUsers('/admin/users');
    expect(wrapper.get('table').text()).toContain('Bị cấm');
    expect(wrapper.get('table').text()).not.toContain('banned');
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('2 người');
  });

  it('sorts by last access through the address and asks the server for it', async () => {
    const calls = mockApi(routes());
    const { wrapper, router } = await mountUsers('/admin/users');
    await wrapper.get('[data-testid="users-sort"]').setValue('-lastAccess');
    await flushPromises();
    expect(router.currentRoute.value.query.sort).toBe('-lastAccess');
    expect(
      calls
        .filter((call) => call.path === '/admin/users')
        .at(-1)!
        .query.get('sort'),
    ).toBe('-lastAccess');
  });

  it('opens a user from the exact lookup and shows the id and rank', async () => {
    mockApi(routes());
    const { wrapper, router } = await mountUsers('/admin/users');
    await wrapper.get('form input').setValue('tuan_k');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.query.user).toBe('tuan_k');
    expect(wrapper.get('[data-testid="user-card"]').text()).toContain(target.id);
  });

  it('bans with a required reason after confirming, and refreshes the card and the staff list', async () => {
    const calls = mockApi(routes(undefined, { 'POST /users/tuan_k/ban': { status: 204 } }));
    const { wrapper } = await mountUsers('/admin/users?user=tuan_k');
    await click(wrapper, 'Cấm người dùng');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.get('#ban-reason').attributes('aria-invalid')).toBe('true');
    await wrapper.get('#ban-reason').setValue('Spam blog');
    await click(wrapper, 'Cấm người dùng');
    expect(calls.some((call) => call.path.endsWith('/ban'))).toBe(false);
    await confirmDialog('Cấm');
    expect(calls.find((call) => call.path.endsWith('/ban'))?.body).toEqual({ reason: 'Spam blog' });
    expect(calls.filter((call) => call.path === '/users/tuan_k')).toHaveLength(2);
    expect(calls.filter((call) => call.path === '/admin/users')).toHaveLength(2);
  });

  it('puts the reserved-reason refusal under the reason box', async () => {
    mockApi(
      routes(undefined, {
        'POST /users/tuan_k/ban': fail(400, 'validation_failed', {
          reason: ['Reserved for automatic contest-cheating bans.'],
        }),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users?user=tuan_k');
    await wrapper.get('#ban-reason').setValue('Gian lận trong kỳ thi');
    await click(wrapper, 'Cấm người dùng');
    await confirmDialog('Cấm');
    expect(wrapper.get('#ban-reason').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Reserved for automatic contest-cheating bans.');
  });

  it('shows a banned account with its ban reason, offers unban, and turns a 403 into text', async () => {
    const banned = userPage({
      username: 'tuan_k',
      displayRank: 'banned',
      staff: { isSuperuser: false, isActive: true, banReason: 'Spam blog' },
    });
    mockApi(
      routes(undefined, {
        'GET /users/tuan_k': ok(banned),
        'POST /users/tuan_k/unban': fail(403, 'forbidden'),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users?user=tuan_k');
    expect(wrapper.text()).toContain('Tài khoản đã bị cấm');
    expect(wrapper.text()).toContain('Lý do cấm: Spam blog');
    await click(wrapper, 'Bỏ cấm');
    expect(wrapper.get('[data-testid="user-card"] [role="alert"]').text()).toContain(
      'Bạn không có quyền làm việc này.',
    );
  });

  it('offers impersonation to a superuser only, and not for another superuser or a banned account', async () => {
    mockApi(routes());
    const plain = await mountUsers('/admin/users?user=tuan_k');
    expect(plain.wrapper.text()).not.toContain('Đóng vai tuan_k');
    plain.wrapper.unmount();
    mockApi(routes(superuserViewer()));
    const asSuperuser = await mountUsers('/admin/users?user=tuan_k');
    expect(asSuperuser.wrapper.text()).toContain('Đóng vai tuan_k');
    asSuperuser.wrapper.unmount();
    mockApi(
      routes(superuserViewer(), {
        'GET /users/tuan_k': ok(
          userPage({
            username: 'tuan_k',
            staff: { isSuperuser: true, isActive: true, banReason: null },
          }),
        ),
      }),
    );
    const otherSuperuser = await mountUsers('/admin/users?user=tuan_k');
    expect(otherSuperuser.wrapper.text()).not.toContain('Đóng vai tuan_k');
  });

  it('starts viewing as the user: the session switches, the previous account’s cache is dropped, and the page goes home', async () => {
    const asTarget = sessionResponse({
      user: sessionUser({ id: target.id, username: 'tuan_k' }),
      impersonatorId: 'staff-id',
    });
    // The page lands on `/`, which loads the home data of the account it now shows: `tuan_k`.
    const calls = mockApi(
      routes(superuserViewer(), {
        ...homeRoutes,
        'GET /users/tuan_k/ratings': ok(ratingHistory()),
        [`POST /auth/impersonate/${target.id}`]: ok(asTarget),
      }),
    );
    const { wrapper, router, queryClient } = await mountUsers('/admin/users?user=tuan_k');
    expect(
      queryClient.getQueryCache().findAll({ queryKey: ['admin', 'users'] }).length,
    ).toBeGreaterThan(0);
    await click(wrapper, 'Đóng vai tuan_k');
    await confirmDialog('Bắt đầu đóng vai');
    expect(calls.some((call) => call.path === `/auth/impersonate/${target.id}`)).toBe(true);
    const session = useSessionStore();
    expect(session.user?.username).toBe('tuan_k');
    expect(session.impersonatorId).toBe('staff-id');
    expect(queryClient.getQueryCache().findAll({ queryKey: ['admin', 'users'] })).toHaveLength(0);
    // The navigation to `/` loads the home page chunk first: in jsdom that takes seconds, so the wait and the test are long.
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/'), {
      timeout: 12000,
    });
  }, 20_000);

  it('says why an impersonation was refused when the backend still answers 403', async () => {
    mockApi(
      routes(superuserViewer(), {
        [`POST /auth/impersonate/${target.id}`]: fail(403, 'forbidden'),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users?user=tuan_k');
    await click(wrapper, 'Đóng vai tuan_k');
    await confirmDialog('Bắt đầu đóng vai');
    expect(document.body.textContent).toContain(
      'Không đóng vai được siêu quản trị khác hoặc tài khoản đã khoá.',
    );
  });
});

const PAGE_OF_TWO = page(
  [
    staffUser(),
    staffUser({
      id: 'u-2',
      username: 'spammer',
      displayRank: 'banned',
      isActive: false,
      banReason: 'Spam blog',
    }),
  ],
  { total: 2 },
);
const usersRequests = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/admin/users');

describe('UsersPage list', () => {
  afterEach(() => vi.useRealTimers());

  it('lists banned accounts too, opens one with "Mở" and keeps the filter in the URL', async () => {
    mockApi(routes());
    const { wrapper, router } = await mountUsers('/admin/users?q=tu');
    expect(wrapper.text()).toContain('spammer');
    await wrapper.findAll('[data-testid="user-row"]')[0]!.get('button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ user: 'tuan_k', q: 'tu' });
  });

  it.each([
    ['', null],
    ['?tab=active', 'false'],
    ['?tab=banned', 'true'],
  ])('on %s asks the backend for banned=%s', async (search, banned) => {
    const calls = mockApi(routes());
    await mountUsers(`/admin/users${search}`);
    expect(usersRequests(calls).at(-1)!.query.get('banned')).toBe(banned);
  });

  it('shows the ban reason instead of the join date on the "Đã cấm" tab', async () => {
    mockApi(routes(undefined, { 'GET /admin/users': PAGE_OF_TWO }));
    const { wrapper } = await mountUsers('/admin/users?tab=banned');
    const headers = wrapper.findAll('th').map((cell) => cell.text());
    expect(headers).toContain('Lý do cấm');
    expect(headers).not.toContain('Tham gia');
    expect(wrapper.findAll('[data-testid="user-row"]')[1]!.text()).toContain('Spam blog');
    expect(wrapper.get('[data-testid="tab-banned"]').attributes('aria-current')).toBe('page');
  });

  it('sends the typed prefix once, trimmed, from page 1, and writes it to the URL', async () => {
    const calls = mockApi(routes());
    const { wrapper, router } = await mountUsers('/admin/users?page=3');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await wrapper.get('input[type="search"]').setValue('  tuan ');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS);
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ q: 'tuan' });
    const last = usersRequests(calls).at(-1)!;
    expect([last.query.get('search'), last.query.get('page')]).toEqual(['tuan', '1']);
  });

  it('shows the last access as a relative time over the exact time, and says when there was none', async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    mockApi(
      routes(undefined, {
        'GET /admin/users': page(
          [
            staffUser({ lastAccess: fiveMinutesAgo }),
            staffUser({ id: 'u-3', username: 'moi_dk', lastAccess: null }),
          ],
          { total: 2 },
        ),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users');
    const [seen, never] = wrapper.findAll('[data-testid="user-row"]');
    expect(seen!.text()).toContain('5 phút trước');
    expect(never!.text()).toContain('Chưa từng truy cập');
  });

  it('marks a banned account and an account that was never activated, and only those', async () => {
    mockApi(
      routes(undefined, {
        'GET /admin/users': page(
          [
            staffUser({ username: 'a_ok' }),
            staffUser({ id: 'u-2', username: 'b_ban', banReason: 'Spam', isActive: false }),
            staffUser({ id: 'u-3', username: 'c_new', isActive: false }),
          ],
          { total: 3 },
        ),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users');
    const rows = wrapper.findAll('[data-testid="user-row"]').map((row) => row.text());
    expect(rows.map((text) => text.includes('Đã cấm'))).toEqual([false, true, false]);
    expect(rows.map((text) => text.includes('Chưa kích hoạt'))).toEqual([false, false, true]);
  });

  it('names a known rank in Vietnamese and keeps an unknown rank as the server sent it', async () => {
    mockApi(
      routes(undefined, {
        'GET /admin/users': page(
          [staffUser(), staffUser({ id: 'u-2', username: 'mod_x', displayRank: 'moderator' })],
          { total: 2 },
        ),
      }),
    );
    const { wrapper } = await mountUsers('/admin/users');
    const rows = wrapper.findAll('[data-testid="user-row"]');
    expect(rows[0]!.text()).toContain('Thành viên');
    expect(rows[1]!.text()).toContain('moderator');
  });

  it('says what an empty search found, and never offers a page the backend refuses', async () => {
    mockApi(routes(undefined, { 'GET /admin/users': page([], { total: 0 }) }));
    const { wrapper } = await mountUsers('/admin/users?q=zzz');
    expect(wrapper.text()).toContain('Không có người dùng nào khớp “zzz”.');
    mockApi(
      routes(undefined, {
        'GET /admin/users': page(staffUsers(50), { total: 50 * 900, page: 499 }),
      }),
    );
    const deep = await mountUsers('/admin/users?page=499');
    expect(deep.wrapper.text()).toContain('Trang 499 / 500');
  });
});
