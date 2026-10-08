import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { staffViewer, superuserViewer } from '@/test/admin-routes';
import { loginRoutes } from '@/test/auth-routes';

/** AdminShell loads lazily from AppShell: wait until its top bar is in the DOM. */
const waitForAdminShell = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  vi.waitFor(() => {
    if (!wrapper.find('[data-testid="admin-topbar"]').exists()) throw new Error('shell not yet');
  });

const navLinks = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.findAll('[data-testid="admin-nav"] a').map((link) => link.text());

describe('AdminShell', () => {
  it('greets the staff member and lists only the screens their permissions open', async () => {
    mockApi(staffViewer(['judge.add_problem', 'judge.import_polygon_package']));
    const { wrapper } = await mountApp('/admin');
    await waitForAdminShell(wrapper);
    expect(wrapper.text()).toContain('Chào minhthu');
    expect(navLinks(wrapper)).toEqual(['Bài tập', 'Nhập từ Polygon']);
    expect(wrapper.find('[data-testid="admin-dashboard"]').text()).toContain(
      '/admin/problems/import',
    );
    expect(wrapper.text()).not.toContain('Máy chấm');
    expect(wrapper.find('[data-testid="admin-bit"]').attributes('data-placement')).toBe('greeting');
  });

  it('keeps the URL and shows the forbidden panel, not the screen, without the permission', async () => {
    const calls = mockApi(staffViewer(['judge.add_problem']));
    const { wrapper, router } = await mountApp('/admin/similarity');
    await waitForAdminShell(wrapper);
    expect(router.currentRoute.value.fullPath).toBe('/admin/similarity');
    const panel = wrapper.find('[data-testid="admin-forbidden"]');
    expect(panel.text()).toContain('judge.moss_contest');
    expect(wrapper.text()).not.toContain('Màn hình này chưa có bản vẽ');
    expect(calls.map((call) => call.path).sort()).toEqual(['/auth/me', '/profile']);
  });

  it('gives a non-staff viewer the site not-found page with no admin chrome', async () => {
    mockApi(signedInViewer());
    const { wrapper } = await mountApp('/admin/problems');
    expect(wrapper.find('[data-testid="admin-topbar"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Không tìm thấy');
  });

  it('sends an anonymous viewer to sign in', async () => {
    mockApi({ ...anonymousViewer, ...loginRoutes });
    const { router } = await mountApp('/admin');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });

  it('replaces the site header with the admin top bar and keeps one #main', async () => {
    mockApi(superuserViewer());
    const { wrapper } = await mountApp('/admin/types');
    await waitForAdminShell(wrapper);
    expect(wrapper.find('[data-testid="admin-topbar"]').text()).toContain('Chỉ dành cho nhân viên');
    expect(wrapper.findAll('#main')).toHaveLength(1);
    expect(wrapper.find('[data-testid="admin-nav"] [aria-current="page"]').text()).toBe(
      'Loại bài và thẻ',
    );
    expect(wrapper.find('[data-testid="admin-bit"]').attributes('data-placement')).toBe(
      'placeholder',
    );
  });

  it('shows a staff-only not-found inside the admin layout for an unknown admin path', async () => {
    mockApi(superuserViewer());
    const { wrapper } = await mountApp('/admin/nope');
    await waitForAdminShell(wrapper);
    expect(wrapper.find('[data-testid="admin-topbar"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Không tìm thấy');
  });

  it('names on a dashboard card only a permission the viewer holds', async () => {
    mockApi(staffViewer(['judge.edit_own_contest']));
    const { wrapper } = await mountApp('/admin');
    await waitForAdminShell(wrapper);
    const dashboard = wrapper.find('[data-testid="admin-dashboard"]').text();
    expect(dashboard).toContain('judge.edit_own_contest');
    expect(dashboard).not.toContain('judge.add_contest');
  });
});
