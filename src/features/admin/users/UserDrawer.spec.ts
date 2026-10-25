import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, noContent, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, superuserViewer } from '@/test/admin-routes';
import { userPage } from '@/test/fixtures';
import { emptyAccessRoutes, userEdit } from '@/test/admin-fixtures/user-edit';

const PROFILE_URL = '/admin/users/tuan_k/profile';
const routes = () => ({
  ...superuserViewer(),
  'GET /admin/users': ok([]),
  'GET /users/tuan_k': ok(
    userPage({
      username: 'tuan_k',
      staff: { isSuperuser: false, isActive: true, banReason: null },
    }),
  ),
  [`GET ${PROFILE_URL}`]: ok(userEdit()),
  [`PATCH ${PROFILE_URL}`]: ok(userEdit({ fullName: 'Khang Tuấn' })),
  ...emptyAccessRoutes('tuan_k'),
});
const inBody = <T extends HTMLElement>(selector: string) =>
  document.body.querySelector<T>(selector);
const buttonNamed = (text: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === text,
  );

async function openWithFullName(fullName: string) {
  const mounted = await mountApp('/admin/users?user=tuan_k');
  await vi.waitFor(() => expect(inBody('#edit-full-name')).not.toBeNull());
  const box = inBody<HTMLInputElement>('#edit-full-name')!;
  box.value = fullName;
  box.dispatchEvent(new Event('input'));
  await flushPromises();
  return mounted;
}

describe('UserDrawer', () => {
  vi.setConfig({ testTimeout: 20_000 });

  it('unbans a banned account only after confirming, toasts it and refetches the user', async () => {
    const calls = mockApi({
      ...routes(),
      'GET /users/tuan_k': ok(
        userPage({
          username: 'tuan_k',
          displayRank: 'banned',
          staff: { isSuperuser: false, isActive: false, banReason: 'Nộp bài hộ.' },
        }),
      ),
      'POST /users/tuan_k/unban': noContent(),
    });
    await mountApp('/admin/users?user=tuan_k&section=account');
    await vi.waitFor(() => expect(inBody('[data-testid="unban-open"]')).not.toBeNull());
    expect(document.body.textContent).toContain('Lý do cấm: Nộp bài hộ.');
    inBody<HTMLButtonElement>('[data-testid="unban-open"]')!.click();
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/unban'))).toBe(false);
    const userReads = () => calls.filter((call) => call.path === '/users/tuan_k').length;
    const before = userReads();
    await confirmDialog('Bỏ cấm');
    expect(calls.filter((call) => call.path === '/users/tuan_k/unban')).toHaveLength(1);
    await vi.waitFor(() => expect(document.body.textContent).toContain('Đã bỏ cấm tuan_k.'));
    expect(userReads()).toBeGreaterThan(before);
  });

  it('saves the open tab from the footer, sending only the changed field', async () => {
    const calls = mockApi(routes());
    await openWithFullName('Khang Tuấn');
    expect(document.body.textContent).toContain('1 thay đổi chưa lưu');
    buttonNamed('Lưu')!.click();
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ fullName: 'Khang Tuấn' });
  });

  it('asks before closing over unsaved changes, and stays open on Ở lại', async () => {
    mockApi(routes());
    const { router } = await openWithFullName('Tên khác');
    buttonNamed('Đóng')!.click();
    await flushPromises();
    expect(document.body.textContent).toContain('Rời trang?');
    buttonNamed('Ở lại')!.click();
    await flushPromises();
    expect(router.currentRoute.value.query.user).toBe('tuan_k');
    expect(inBody<HTMLInputElement>('#edit-full-name')!.value).toBe('Tên khác');
    // The first leave dialog may still be fading out: wait for the new one before confirming.
    await vi.waitFor(() =>
      expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1),
    );
    buttonNamed('Đóng')!.click();
    await vi.waitFor(() => expect(buttonNamed('Rời trang')).toBeDefined());
    await confirmDialog('Rời trang');
    await vi.waitFor(() => expect(router.currentRoute.value.query.user).toBeUndefined());
  });
});
