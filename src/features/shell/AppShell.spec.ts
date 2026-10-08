import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { profile, sessionUser, signedIn, signedOut } from '@/test/fixtures';
import { mockApi, noContent, ok } from '@/test/mock-api';
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

describe('app shell', () => {
  it('marks the current section in the main navigation', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/problems/aplusb');
    const nav = wrapper.get('nav[aria-label="Điều hướng chính"]');
    expect(nav.get('[aria-current="page"]').text()).toBe('Bài tập');
    expect(nav.findAll('a').map((link) => link.text())).toEqual([
      'Trang chủ',
      'Bài tập',
      'Kỳ thi',
      'Xếp hạng',
      'Blog',
    ]);
  });

  it('offers sign in (returning here) and sign up to anonymous viewers', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get('a[href="/login?redirect=/blog"]').text()).toBe('Đăng nhập');
    expect(wrapper.get('a[href="/register"]').text()).toBe('Đăng ký');
  });

  it('signs out from the user menu and stays on a public page', async () => {
    const calls = mockApi({
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
      'GET /auth/me': signedIn({ user: sessionUser({ isStaff: true }) }),
      'GET /profile': ok(profile()),
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Tài khoản của user_01"]').trigger('click');
    expect(document.body.textContent).toContain('Quản trị');
  });

  it('tells assistive technology whether a menu is open', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    const trigger = wrapper.get('button[aria-label="Đổi giao diện"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    await trigger.trigger('click');
    await flushPromises();
    expect(trigger.attributes('aria-expanded')).toBe('true');
    await clickMenuItem('Glass sáng');
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });

  it('switches theme at runtime without saving for anonymous viewers', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Đổi giao diện"]').trigger('click');
    await clickMenuItem('Glass sáng');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
    expect(calls.filter((call) => call.method === 'PATCH')).toEqual([]);
  });

  it('saves the theme to the account when signed in', async () => {
    const calls = mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'PATCH /profile': ({ body }) => ok(profile(body as object)),
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Đổi giao diện"]').trigger('click');
    await clickMenuItem('Glass sáng');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ siteTheme: 'light' });
    expect(document.documentElement.dataset.theme).toBe('glass-light');
  });

  it('keeps the local theme when saving to the account fails', async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'PATCH /profile': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
    });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Đổi giao diện"]').trigger('click');
    await clickMenuItem('Glass sáng');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
  });

  it("adopts the account's theme after sign-in and drops it on sign-out", async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ siteTheme: 'light' })),
      'POST /auth/logout': noContent(),
    });
    const { wrapper } = await mountApp('/blog');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
    await wrapper.get('button[aria-label="Tài khoản của user_01"]').trigger('click');
    await clickMenuItem('Đăng xuất');
    expect(document.documentElement.dataset.theme).toBe('glass-dark');
  });

  it('keeps the pre-painted account theme while the profile is still loading', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    document.documentElement.dataset.theme = 'glass-light';
    mockApi({
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
      'GET /auth/me': signedIn(),
      'POST /auth/login': signedIn({ user: secondUser }),
      'GET /profile': () => {
        profileReads += 1;
        return ok(profile({ siteTheme: profileReads === 1 ? 'light' : 'dark' }));
      },
    });
    await mountApp('/blog');
    expect(document.documentElement.dataset.theme).toBe('glass-light');
    const session = useSessionStore();
    session.$patch({ status: 'anonymous', user: null }); // what a 401 on any request does
    await flushPromises();
    await session.login({ username: 'user_02', password: 'secret-password' });
    await flushPromises();
    expect(document.documentElement.dataset.theme).toBe('glass-dark');
  });

  it('does not read the profile while a password change is required', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn({ passwordChangeRequired: true }) });
    await mountApp('/blog');
    expect(calls.some((call) => call.path === '/profile')).toBe(false);
  });

  it('switches the interface language', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    await wrapper.get('button[aria-label="Switch to English"]').trigger('click');
    expect(wrapper.get('nav[aria-label="Main navigation"]').text()).toContain('Problems');
    expect(document.documentElement.lang).toBe('en');
  });

  it('has a skip link to the main content', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.get('a[href="#main"]').text()).toBe('Bỏ qua đến nội dung chính');
    expect(wrapper.find('main#main').exists()).toBe(true);
  });
});
