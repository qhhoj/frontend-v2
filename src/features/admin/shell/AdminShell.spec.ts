import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { staffViewer } from '@/test/admin-routes';
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
    mockApi(staffViewer(['judge.add_problem']));
    const { wrapper } = await mountApp('/admin');
    await waitForAdminShell(wrapper);
    expect(wrapper.text()).toContain('Chào minhthu');
    expect(navLinks(wrapper)).toEqual(['Tổng quan', 'Bài tập', 'Nhập từ Polygon', 'Nhập tệp .zip']);
    const dashboard = wrapper.find('[data-testid="admin-dashboard"]').text();
    expect(dashboard).toContain('Tạo bài tập');
    expect(dashboard).toContain('Nhập từ Polygon');
    expect(dashboard).not.toContain('Tạo kỳ thi');
    expect(dashboard).not.toContain('/admin/');
    expect(dashboard).not.toContain('judge.');
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
});
