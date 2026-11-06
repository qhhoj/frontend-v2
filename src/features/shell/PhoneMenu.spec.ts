import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { PHONE_QUERY } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import { profile, sessionUser, signedIn } from '@/test/fixtures';
import { blogListRoutes } from '@/test/community-routes';
import { stubMatchMedia } from '@/test/match-media';
import { mockApi, ok } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { mountApp } from '@/test/mount';

const sheet = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
const openOnPhone = async (path: string) => {
  stubMatchMedia().setQuery(PHONE_QUERY, true);
  const app = await mountApp(path);
  await app.wrapper.get('[data-testid="phone-menu"]').trigger('click');
  await flushPromises();
  return app;
};

describe('phone menu', () => {
  it('lists the seven sections with the current one marked', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    await openOnPhone('/blog');
    const links = [...sheet()!.querySelectorAll('nav a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/problems',
      '/contests',
      '/submissions',
      '/users',
      '/blog',
      '/organizations',
    ]);
    expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toEqual([
      links[5],
    ]);
  });

  it('keeps sign-in in the header and register in the sheet, and switches the language', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    const { wrapper } = await openOnPhone('/blog');
    expect(wrapper.find('button[aria-label="Switch to English"]').exists()).toBe(false);
    expect(wrapper.find('header a[href="/login?redirect=/blog"]').exists()).toBe(true);
    expect(sheet()?.querySelector('a[href="/login?redirect=/blog"]')).toBeNull();
    expect(sheet()?.querySelector('a[href="/register"]')).not.toBeNull();
    const english = [...sheet()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'English',
    );
    english!.click();
    await flushPromises();
    expect(useLocaleStore().locale).toBe('en');
  });

  it('shows the bell in the header for a signed-in viewer, not in the sheet', async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'GET /notifications/unread-count': ok({ count: 3 }),
    });
    const { wrapper } = await openOnPhone('/blog');
    expect(wrapper.find('[data-testid="notification-bell"]').exists()).toBe(true);
    expect(wrapper.find('header a[href^="/login"]').exists()).toBe(false);
    expect(sheet()!.querySelector('[data-testid="phone-menu-notifications"]')).toBeNull();
  });

  it("leads the account's pages with the signed-in viewer's own profile", async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn({ user: sessionUser({ username: 'bitcoder' }) }),
      'GET /profile': ok(profile()),
    });
    await openOnPhone('/blog');
    const account = sheet()!.querySelector('section[aria-label="Tài khoản của bitcoder"]')!;
    const first = account.querySelector('a')!;
    expect(first.textContent?.trim()).toBe('Hồ sơ của tôi');
    expect(first.getAttribute('href')).toBe('/users/bitcoder');
    expect(account.querySelectorAll('a[href="/users/bitcoder"]')).toHaveLength(1);
  });

  it("lists the account's pages for staff and closes when one is followed", async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn({ user: sessionUser({ isStaff: true }) }),
      'GET /profile': ok(profile()),
    });
    const { wrapper, router } = await openOnPhone('/blog');
    const links = [...sheet()!.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    expect(links).toEqual(expect.arrayContaining(['/users/user_01', '/settings', '/admin']));
    const menuButton = wrapper.get('[data-testid="phone-menu"]');
    expect(menuButton.attributes('aria-expanded')).toBe('true');
    await router.push('/blog#latest');
    await flushPromises();
    expect(menuButton.attributes('aria-expanded')).toBe('false');
  });
});
