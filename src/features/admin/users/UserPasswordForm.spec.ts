import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, rateLimited } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { openDialog, staffViewer } from '@/test/admin-routes';
import { userPage } from '@/test/fixtures';
import { emptyAccessRoutes, userEdit } from '@/test/admin-fixtures/user-edit';

const PASSWORD_URL = '/admin/users/tuan_k/password';
const routes = (passwordAnswer: ReturnType<typeof ok>) => ({
  ...staffViewer(['judge.ban_user', 'judge.change_profile', 'auth.change_user']),
  'GET /admin/users': ok([]),
  'GET /users/tuan_k': ok(
    userPage({
      username: 'tuan_k',
      staff: { isSuperuser: false, isActive: true, banReason: null },
    }),
  ),
  'GET /admin/users/tuan_k/profile': ok(userEdit()),
  ...emptyAccessRoutes('tuan_k'),
  [`POST ${PASSWORD_URL}`]: passwordAnswer,
});

async function openPasswordForm() {
  const { wrapper } = await mountApp('/admin/users?user=tuan_k');
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="user-edit-open"]').exists()).toBe(true),
  );
  await wrapper.get('[data-testid="user-edit-open"]').trigger('click');
  await vi.waitFor(() => expect(document.body.querySelector('#edit-new-password')).not.toBeNull());
  const dialog = openDialog();
  const fill = (id: string, value: string) => {
    const input = dialog.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  fill('edit-new-password', 'brand new passphrase 7');
  fill('edit-confirm-password', 'brand new passphrase 7');
  fill('edit-admin-password', 'my own secret');
  await flushPromises();
  const submit = [...dialog.querySelectorAll('button[type="submit"]')].find(
    (button) => button.textContent?.trim() === 'Đặt mật khẩu',
  ) as HTMLButtonElement;
  submit.click();
  await flushPromises();
  return dialog;
}

describe('UserPasswordForm', () => {
  vi.setConfig({ testTimeout: 20_000 });

  it("sends the new password with the admin's own password and says the user was signed out", async () => {
    const calls = mockApi(routes({ status: 204 }));
    const dialog = await openPasswordForm();
    expect(calls.find((call) => call.path === PASSWORD_URL)?.body).toEqual({
      newPassword: 'brand new passphrase 7',
      currentPassword: 'my own secret',
    });
    expect(dialog.textContent).toContain('họ đã bị đăng xuất khỏi mọi phiên');
  });

  it('shows a wrong admin password under that field and keeps what was typed', async () => {
    mockApi(
      routes(
        fail(400, 'invalid_credentials', undefined, [
          {
            field: 'currentPassword',
            code: 'password_incorrect',
            message: 'Current password is incorrect.',
          },
        ]),
      ),
    );
    const dialog = await openPasswordForm();
    const admin = dialog.querySelector<HTMLInputElement>('#edit-admin-password')!;
    expect(admin.getAttribute('aria-invalid')).toBe('true');
    expect(dialog.querySelector('#edit-admin-password-error')?.textContent).toBe(
      'Mật khẩu của bạn không đúng.',
    );
    expect(admin.value).toBe('my own secret');
  });

  it('shows the hourly limit as a line under the button, with the wait', async () => {
    mockApi(routes(rateLimited(120)));
    const dialog = await openPasswordForm();
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain('120');
    expect(dialog.querySelector('#edit-admin-password')?.getAttribute('aria-invalid')).toBe(
      'false',
    );
  });
});
