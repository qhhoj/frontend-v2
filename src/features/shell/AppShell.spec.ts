import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { profile, sessionUser, signedIn, signedOut } from '@/test/fixtures';
import { mockApi, noContent, ok } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';

const clickMenuItem = async (label: string) => {
  const item = [...document.body.querySelectorAll('[role="menuitem"]')].find((element) =>
    element.textContent?.includes(label),
  );
  if (!item) throw new Error(`No menu item "${label}"`);
  (item.querySelector('a') ?? (item as HTMLElement)).click();
  await flushPromises();
};

const openPanel = async (wrapper: VueWrapper) => {
  await wrapper.get('button[aria-label="Giao diện"]').trigger('click');
  await flushPromises();
};
/** A Style, Mode or Glass button of the open panel by its visible text. */
const clickInPanel = async (label: string) => {
  const button = [
    ...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
  ].find((element) => element.textContent?.trim() === label);
  if (!button) throw new Error(`No panel button "${label}"`);
  button.click();
  await flushPromises();
};
const patchesOf = (calls: Array<{ method: string; body: unknown }>) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);

describe('app shell', () => {
  it('has exactly one live region, outside the page content, and it is quiet when nothing loads', async () => {
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    const regions = wrapper.findAll('[role="status"]');
    expect(regions).toHaveLength(1);
    expect(regions[0]!.attributes('aria-live')).toBe('polite');
    expect(regions[0]!.text()).toBe('');
    expect(wrapper.get('#main').find('[role="status"]').exists()).toBe(false);
  });

  it('signs out from the user menu and stays on a public page', async () => {
    const calls = mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'POST /auth/logout': noContent(),
    });
    const { wrapper, router, queryClient } = await mountApp('/blog');
    queryClient.setQueryData(['problems', 'list', { page: 1 }], { rows: ['signed-in view'] });
    await wrapper.get('button[aria-label="Tài khoản của user_01"]').trigger('click');
    expect(document.body.textContent).not.toContain('Quản trị');
    await clickMenuItem('Đăng xuất');
    expect(queryClient.getQueryData(['problems', 'list', { page: 1 }])).toBeUndefined();
    expect(calls.some((call) => call.method === 'POST' && call.path === '/auth/logout')).toBe(true);
    expect(router.currentRoute.value.path).toBe('/blog');
    expect(wrapper.find('a[href="/login?redirect=/blog"]').exists()).toBe(true);
  });

  it('offers administration to staff', async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn({ user: sessionUser({ isStaff: true }) }),
      'GET /profile': ok(profile()),
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Tài khoản của user_01"]').trigger('click');
    expect(document.body.textContent).toContain('Quản trị');
  });

  it('saves only the mode to the account when signed in, and leaves the look off', async () => {
    const calls = mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'PATCH /profile': ({ body }) => ok(profile(body as object)),
    });
    const { wrapper } = await mountApp('/blog');
    await openPanel(wrapper);
    await clickInPanel('Glass');
    await clickInPanel('Sáng');
    expect(patchesOf(calls)).toEqual([{ siteTheme: 'glass-auto' }, { siteTheme: 'glass-light' }]);
    expect(document.documentElement.dataset.theme).toBe('glass-light');
    expect(document.documentElement.dataset.accent).toBeUndefined();
  });

  it.each([
    [['Tự động'], 'auto', 'clay-light'],
    [['Glass', 'Tự động'], 'glass-auto', 'glass-light'],
  ])('saves %j to the account as %s and follows the device', async (picks, saved, shown) => {
    const calls = mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ siteTheme: 'clay-dark' })),
      'PATCH /profile': ({ body }) => ok(profile(body as object)),
    });
    const { wrapper } = await mountApp('/blog');
    await openPanel(wrapper);
    for (const pick of picks) await clickInPanel(pick);
    expect(patchesOf(calls).at(-1)).toEqual({ siteTheme: saved });
    expect(document.documentElement.dataset.theme).toBe(shown);
  });

  it('keeps the local theme when saving to the account fails', async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'PATCH /profile': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
    });
    const { wrapper } = await mountApp('/blog');
    await openPanel(wrapper);
    await clickInPanel('Glass');
    await clickInPanel('Sáng');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
  });

  it("adopts the account's theme after sign-in and drops it on sign-out", async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ siteTheme: 'light' })),
      'POST /auth/logout': noContent(),
    });
    const { wrapper } = await mountApp('/blog');
    expect(document.documentElement.dataset.theme).toBe('clay-light');
    await wrapper.get('button[aria-label="Tài khoản của user_01"]').trigger('click');
    await clickMenuItem('Đăng xuất');
    expect(document.documentElement.dataset.theme).toBe('clay-dark');
  });

  it('keeps the pre-painted account theme while the profile is still loading', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    localStorage.setItem('qhhoj.resolvedBy', 'account');
    document.documentElement.dataset.theme = 'glass-light';
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
    });
    await mountApp('/blog');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
  });

  it("reads the next account's theme after the previous session expired", async () => {
    const secondUser = sessionUser({
      id: '0192a000-0000-7000-8000-000000000002',
      username: 'user_02',
    });
    let profileReads = 0;
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'POST /auth/login': signedIn({ user: secondUser }),
      'GET /profile': () => {
        profileReads += 1;
        return ok(profile({ siteTheme: profileReads === 1 ? 'light' : 'dark' }));
      },
    });
    await mountApp('/blog');
    expect(document.documentElement.dataset.theme).toBe('clay-light');
    const session = useSessionStore();
    session.$patch({ status: 'anonymous', user: null }); // what a 401 on any request does
    await flushPromises();
    await session.login({ username: 'user_02', password: 'secret-password' });
    await flushPromises();
    expect(document.documentElement.dataset.theme).toBe('clay-dark');
  });

  it('does not read the profile while a password change is required', async () => {
    const calls = mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn({ passwordChangeRequired: true }),
    });
    await mountApp('/blog');
    expect(calls.some((call) => call.path === '/profile')).toBe(false);
  });
});
