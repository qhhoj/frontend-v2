import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { loginRoutes } from '@/test/auth-routes';
import { homeRoutes } from '@/test/home-routes';
import { profile, signedIn } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, noContent, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** The breach flag clears on the server once the password changed; signing out lands on the login screen. */
function changeApi(routes: Record<string, MockHandler> = {}, forced = true) {
  let changed = false;
  return mockApi({
    'GET /auth/me': () => signedIn({ passwordChangeRequired: forced && !changed }),
    'POST /auth/password/change': () => {
      changed = true;
      return noContent();
    },
    'GET /profile': ok(profile()),
    'POST /auth/logout': noContent(),
    ...loginRoutes,
    ...routes,
  });
}
const fill = async (
  wrapper: Wrapper,
  current = 'old pass',
  next = 'brand new passphrase',
  again = next,
) => {
  await wrapper.get('input[name="currentPassword"]').setValue(current);
  await wrapper.get('input[name="newPassword"]').setValue(next);
  await wrapper.get('input[name="confirmPassword"]').setValue(again);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};
const describedText = (wrapper: Wrapper, name: string) =>
  wrapper
    .get(`input[name="${name}"]`)
    .attributes('aria-describedby')!
    .split(' ')
    .map((id) => wrapper.get(`[id="${id}"]`).text());
const signOutButton = (wrapper: Wrapper) =>
  wrapper.findAll('button').find((button) => button.text() === 'Đăng xuất');

describe('change-password page', () => {
  it('catches a viewer with a breached password on any page and says why, naming the account', async () => {
    changeApi();
    const { wrapper, router } = await mountApp('/blog');
    expect(router.currentRoute.value.name).toBe('account-password');
    expect(router.currentRoute.value.query.redirect).toBe('/blog');
    expect(wrapper.get('h1').text()).toBe('Đổi mật khẩu để tiếp tục');
    expect(wrapper.get('#main [role="status"]').text()).toContain('rò rỉ dữ liệu công khai');
    expect(wrapper.get('#main [role="status"] strong').text()).toBe('user_01');
  });

  it('offers the account name to password managers, in a field the viewer never sees', async () => {
    changeApi();
    const { wrapper } = await mountApp('/account/password');
    const username = wrapper.get('input[name="username"]');
    expect(username.attributes('autocomplete')).toBe('username');
    expect(username.element.getAttribute('value')).toBe('user_01');
  });

  it('labels the three fields as the board does', async () => {
    changeApi();
    const { wrapper } = await mountApp('/account/password');
    const labels = wrapper.findAll('#main label').map((label) => label.text());
    expect(labels).toEqual(['Mật khẩu hiện tại', 'Mật khẩu mới', 'Nhập lại mật khẩu mới']);
  });

  it('changes the password, reloads the session and returns to where the viewer was', async () => {
    const calls = changeApi();
    const { wrapper, router } = await mountApp('/blog');
    await fill(wrapper);
    expect(calls.find((call) => call.path === '/auth/password/change')?.body).toEqual({
      currentPassword: 'old pass',
      newPassword: 'brand new passphrase',
    });
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/blog'));
  });

  it('shows a wrong current password at its input, by its issue code, not as a summary', async () => {
    changeApi({
      'POST /auth/password/change': fail(
        400,
        'invalid_credentials',
        { currentPassword: ['Current password is incorrect.'] },
        [issue('currentPassword', 'password_incorrect', 'Current password is incorrect.')],
      ),
    });
    const { wrapper } = await mountApp('/blog');
    await fill(wrapper);
    expect(describedText(wrapper, 'currentPassword')).toEqual(['Mật khẩu hiện tại không đúng.']);
    expect(document.activeElement).toBe(wrapper.get('input[name="currentPassword"]').element);
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
  });

  it('explains a breached or reused new password at its input', async () => {
    changeApi({
      'POST /auth/password/change': invalid(
        issue('newPassword', 'password_pwned', 'This password has appeared in a data breach.'),
        issue(
          'newPassword',
          'password_unchanged',
          'New password must differ from the current password.',
        ),
      ),
    });
    const { wrapper } = await mountApp('/blog');
    await fill(wrapper);
    const texts = describedText(wrapper, 'newPassword').join(' ');
    expect(texts).toContain('Mật khẩu này từng bị lộ trong một vụ rò rỉ dữ liệu.');
    expect(texts).toContain('Mật khẩu mới phải khác mật khẩu hiện tại.');
  });

  it('will not send two different new passwords', async () => {
    const calls = changeApi();
    const { wrapper } = await mountApp('/blog');
    await fill(wrapper, 'old pass', 'brand new passphrase', 'brand new passphrasX');
    expect(calls.some((call) => call.path === '/auth/password/change')).toBe(false);
    const confirm = wrapper.get('input[name="confirmPassword"]');
    expect(confirm.attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(confirm.element);
  });

  it('never sends the viewer on to another site after the change', async () => {
    changeApi(homeRoutes);
    const { wrapper, router } = await mountApp('/account/password?redirect=//evil.example');
    await fill(wrapper);
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/'));
  });

  it('says the password changed, not that the change failed, when the session cannot be reloaded', async () => {
    let changed = false;
    mockApi({
      'GET /auth/me': () =>
        changed ? fail(500, 'internal_error') : signedIn({ passwordChangeRequired: true }),
      'POST /auth/password/change': () => {
        changed = true;
        return noContent();
      },
      ...loginRoutes,
    });
    const { wrapper, router } = await mountApp('/account/password');
    await fill(wrapper);
    expect(wrapper.get('#main [role="status"]').text()).toContain('Đã đổi mật khẩu');
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
    expect(wrapper.find('input[name="currentPassword"]').exists()).toBe(false);
    expect(router.currentRoute.value.fullPath).toBe('/account/password');
  });

  it('lets the viewer sign out from the top bar', async () => {
    const calls = changeApi();
    const { wrapper, router } = await mountApp('/account/password');
    await signOutButton(wrapper)!.trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path === '/auth/logout')).toBe(true);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });
});
