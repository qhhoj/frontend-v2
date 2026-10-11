import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer, superuserViewer } from '@/test/admin-routes';
import { ratingHistory, sessionResponse, sessionUser, userPage } from '@/test/fixtures';
import { homeRoutes } from '@/test/home-routes';
import { staffUser } from '@/test/admin-fixtures/users';
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
  // The first mount loads the lazy admin shell chunk.
  vi.setConfig({ testTimeout: 20_000 });

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
    const { wrapper, queryClient } = await mountUsers('/admin/users?user=tuan_k');
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
  });
});

const usersRequests = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/admin/users');

describe('UsersPage list', () => {
  afterEach(() => vi.useRealTimers());

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
});
