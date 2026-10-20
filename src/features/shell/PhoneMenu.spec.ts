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

describe('phone menu (P-01 A)', () => {
  it('holds sign-in and register for a visitor, and switches the language', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    const { wrapper } = await openOnPhone('/blog');
    expect(wrapper.find('button[aria-label="Switch to English"]').exists()).toBe(false);
    expect(sheet()?.querySelector('a[href="/login?redirect=/blog"]')).not.toBeNull();
    const english = [...sheet()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'English',
    );
    english!.click();
    await flushPromises();
    expect(useLocaleStore().locale).toBe('en');
  });

  it('carries the notifications instead of a bell: a dot on the button, the count in the sheet', async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'GET /notifications/unread-count': ok({ count: 3 }),
    });
    const { wrapper } = await openOnPhone('/blog');
    expect(wrapper.find('[data-testid="notification-bell"]').exists()).toBe(false);
    const button = wrapper.get('[data-testid="phone-menu"]');
    expect(button.attributes('aria-label')).toBe('Mở menu, 3 thông báo chưa đọc');
    expect(button.find('[data-testid="phone-menu-dot"]').exists()).toBe(true);
    const row = sheet()!.querySelector('[data-testid="phone-menu-notifications"]')!;
    expect(row.getAttribute('href')).toBe('/notifications');
    expect(row.textContent).toContain('3 chưa đọc');
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
