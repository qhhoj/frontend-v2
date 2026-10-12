import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { loginRoutes } from '@/test/auth-routes';
import { fail, issue, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const TOKEN = 'qh_3f9a1c7e5b2d4a80b6e1c9d7f2a4538e91b0c6d2';
const pageButton = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('#main button').find((button) => button.text() === text)!;
const dialogButton = (text: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(
    (button) => button.textContent?.trim() === text,
  )!;

async function typePassword(value: string) {
  const field = document.body.querySelector<HTMLInputElement>(
    '[role="dialog"] input[name="tokenPassword"]',
  )!;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  await flushPromises();
  return field;
}

async function openSecurity(routes: Record<string, MockHandler>) {
  const calls = mockApi({ ...settingsRoutes(), ...loginRoutes, ...routes });
  const { wrapper, router } = await mountApp('/settings/security');
  return { wrapper, router, calls };
}

describe('Settings › Security › API token', () => {
  it('creates a token after confirming and shows it once', async () => {
    const { wrapper, router } = await openSecurity({
      'POST /auth/token/regenerate': ok({ token: TOKEN }),
    });
    await pageButton(wrapper, 'Tạo token mới').trigger('click');
    await flushPromises();
    await typePassword('mật khẩu');
    dialogButton('Tạo token mới').click();
    await flushPromises();
    expect(wrapper.get('#main code').text()).toBe(TOKEN);
    expect(wrapper.text()).toContain('Hãy sao chép ngay.');
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
    expect(JSON.stringify({ ...localStorage })).not.toContain(TOKEN);
    await router.push('/settings');
    await router.push('/settings/security');
    await flushPromises();
    expect(wrapper.text()).not.toContain(TOKEN);
  });
});

describe('Settings › Security › API token › password', () => {
  it('sends the current password and marks a wrong one on its field', async () => {
    const { wrapper, calls } = await openSecurity({
      'POST /auth/token/regenerate': sequence(
        fail(400, 'invalid_credentials', undefined, [
          issue('currentPassword', 'password_incorrect', 'x'),
        ]),
        ok({ token: TOKEN }),
      ),
    });
    await pageButton(wrapper, 'Tạo token mới').trigger('click');
    await flushPromises();
    const field = await typePassword('sai');
    dialogButton('Tạo token mới').click();
    await flushPromises();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    await typePassword('đúng');
    dialogButton('Tạo token mới').click();
    await flushPromises();
    expect(
      calls.filter((call) => call.path === '/auth/token/regenerate').map((sent) => sent.body),
    ).toEqual([{ currentPassword: 'sai' }, { currentPassword: 'đúng' }]);
    expect(wrapper.get('#main code').text()).toBe(TOKEN);
  });
});

describe('Settings › Security › sign out everywhere', () => {
  it('ends every session after confirming and goes to the sign-in page', async () => {
    const { wrapper, router, calls } = await openSecurity({ 'POST /auth/logout-all': noContent() });
    await pageButton(wrapper, 'Đăng xuất mọi nơi').trigger('click');
    await flushPromises();
    dialogButton('Đăng xuất mọi nơi').click();
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST' && call.path === '/auth/logout-all')).toBe(
      true,
    );
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });

  it('is locked, not clickable, while viewing as another user', async () => {
    const calls = mockApi({
      ...settingsRoutes({ impersonatorId: 'staff-1' }),
      'POST /auth/logout-all': noContent(),
    });
    const { wrapper } = await mountApp('/settings/security');
    const button = pageButton(wrapper, 'Đăng xuất mọi nơi');
    expect(button.attributes('aria-disabled')).toBe('true');
    await button.trigger('click');
    expect(calls.some((call) => call.path === '/auth/logout-all')).toBe(false);
  });
});
