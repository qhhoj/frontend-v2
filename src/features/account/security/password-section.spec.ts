import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { signedIn } from '@/test/fixtures';
import { fail, mockApi, noContent } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const input = (wrapper: VueWrapper, name: string) =>
  wrapper.get<HTMLInputElement>(`input[name="${name}"]`);
/** The security page can hold more password fields (enrolment, add key): this form is addressed by its step. */
const passwordForm = (wrapper: VueWrapper) => wrapper.get('form[data-step="change-password"]');

async function openSecurity(change: MockHandler = noContent()) {
  const calls = mockApi({ ...settingsRoutes(), 'POST /auth/password/change': change });
  const { wrapper, router } = await mountApp('/settings/security');
  return { wrapper, router, calls };
}
async function fillAndSubmit(wrapper: VueWrapper, confirmation = 'ngựa đúng pin kẹp') {
  await input(wrapper, 'currentPassword').setValue('mật khẩu cũ');
  await input(wrapper, 'newPassword').setValue('ngựa đúng pin kẹp');
  await input(wrapper, 'confirmPassword').setValue(confirmation);
  await passwordForm(wrapper).trigger('submit');
  await flushPromises();
}

describe('Settings › Security › password', () => {
  it('changes the password, says other devices were signed out, clears the fields and stays here', async () => {
    const { wrapper, router, calls } = await openSecurity();
    await fillAndSubmit(wrapper);
    const change = calls.find((call) => call.path === '/auth/password/change')!;
    expect(change.body).toEqual({
      currentPassword: 'mật khẩu cũ',
      newPassword: 'ngựa đúng pin kẹp',
    });
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.',
    );
    expect(input(wrapper, 'currentPassword').element.value).toBe('');
    expect(router.currentRoute.value.name).toBe('settings-security');
  });

  it('says the password changed, not that the change failed, when the session cannot be reloaded, and retries only the reload', async () => {
    let changed = false;
    const calls = mockApi({
      ...settingsRoutes(),
      'GET /auth/me': () => (changed ? fail(500, 'http_error') : signedIn()),
      'POST /auth/password/change': () => {
        changed = true;
        return noContent();
      },
    });
    const { wrapper } = await mountApp('/settings/security');
    await fillAndSubmit(wrapper);
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Đã đổi mật khẩu. Chưa tải lại được tài khoản, hãy thử lại.',
    );
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
    expect(wrapper.find('input[name="currentPassword"]').exists()).toBe(false); // never the old-password form again
    changed = false; // the reload works now
    await passwordForm(wrapper).trigger('submit');
    await flushPromises();
    expect(calls.filter((call) => call.path === '/auth/password/change')).toHaveLength(1);
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.',
    );
    expect(input(wrapper, 'currentPassword').element.value).toBe('');
  });
});
