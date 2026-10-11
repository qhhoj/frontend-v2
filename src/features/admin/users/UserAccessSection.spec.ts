import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { openDialog, staffViewer, superuserViewer } from '@/test/admin-routes';
import { userPage } from '@/test/fixtures';
import { userEdit } from '@/test/admin-fixtures/user-edit';

const ACCESS_URL = '/admin/users/tuan_k/access';
const MODS = { id: '0192a000-0000-7000-8000-0000000000a1', name: 'Mods' };
const routes = (viewer: Record<string, unknown>, canEdit: boolean) => ({
  ...viewer,
  'GET /admin/users': ok([]),
  'GET /users/tuan_k': ok(
    userPage({
      username: 'tuan_k',
      staff: { isSuperuser: false, isActive: true, banReason: null },
    }),
  ),
  'GET /admin/users/tuan_k/profile': ok(userEdit()),
  'GET /admin/permissions': ok([
    { codename: 'judge.ban_user', category: 'users', label: 'Ban users' },
    { codename: 'judge.change_comment', category: 'community', label: 'Moderate comments' },
  ]),
  'GET /admin/groups': ok([{ ...MODS, permissions: ['judge.change_comment'], memberCount: 3 }]),
  [`GET ${ACCESS_URL}`]: ok({
    isStaff: true,
    isSuperuser: false,
    groups: [MODS],
    permissions: [],
    effective: [{ codename: 'judge.change_comment', direct: false, viaGroups: ['Mods'] }],
    canEdit,
  }),
  [`PATCH ${ACCESS_URL}`]: ok({
    isStaff: true,
    isSuperuser: false,
    groups: [],
    permissions: ['judge.ban_user'],
    effective: [{ codename: 'judge.ban_user', direct: true, viaGroups: [] }],
    canEdit,
  }),
});

async function openAccess() {
  await mountApp('/admin/users?user=tuan_k&section=access');
  await vi.waitFor(() =>
    expect(document.body.querySelector('[data-testid="user-access"]')).not.toBeNull(),
  );
  return openDialog();
}

/** The drawer footer's save button, labelled for the open tab. */
const saveButton = (dialog: HTMLElement) =>
  [...dialog.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(
    (button) => button.textContent?.trim() === 'Lưu quyền',
  );

describe('UserAccessSection', () => {
  vi.setConfig({ testTimeout: 20_000 });

  it('sends only what a superuser changed: a permission granted and a role removed', async () => {
    const calls = mockApi(routes(superuserViewer(), true));
    const dialog = await openAccess();
    const access = dialog.querySelector('[data-testid="user-access"]')!;
    expect(access.textContent).toContain('qua Mods');
    const banBox = [...access.querySelectorAll('label')]
      .find((label) => label.textContent?.includes('Cấm người dùng'))!
      .querySelector('input')!;
    banBox.click();
    (access.querySelector('[data-testid="role-chip"]') as HTMLButtonElement).click();
    await flushPromises();
    saveButton(dialog)!.click();
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH' && call.path === ACCESS_URL)?.body).toEqual(
      { addPermissions: ['judge.ban_user'], removeGroups: [MODS.id] },
    );
  });

  it('shows a non-superuser the access read-only, with no controls', async () => {
    mockApi(
      routes(staffViewer(['judge.ban_user', 'judge.change_profile', 'auth.change_user']), false),
    );
    const dialog = await openAccess();
    const access = dialog.querySelector('[data-testid="user-access"]')!;
    expect(access.querySelector('[data-testid="access-read-only"]')).not.toBeNull();
    expect(access.querySelector('input[type="checkbox"]')).toBeNull();
    expect(saveButton(dialog)).toBeUndefined();
    expect(access.textContent).toContain('Kiểm duyệt bình luận');
    expect(access.textContent).not.toContain('judge.ban_user');
  });
});
