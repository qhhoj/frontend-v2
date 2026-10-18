import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import { submissionStats } from '@/test/fixtures';
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
    expect(wrapper.text()).toContain('Chào bitcoder');
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

  it('puts the figures that wait for staff ahead of the calm judging ones', async () => {
    mockApi({
      ...staffViewer(['judge.change_judge', 'judge.change_comment']),
      'GET /submissions/stats': ok(
        submissionStats({ queueLength: 0, judgesOnline: 2, judgesTotal: 2 }),
      ),
      'GET /comments/reports': page([{}, {}], { pageSize: 20 }),
    });
    const { wrapper } = await mountApp('/admin');
    await waitForAdminShell(wrapper);
    const tileLabels = () =>
      wrapper.findAll('[aria-labelledby="admin-overview-title"] li').map((tile) => tile.text());
    await vi.waitFor(() => expect(tileLabels()[0]).toContain('Bình luận bị báo cáo'));
    expect(tileLabels()[0]).toContain('Cần xử lý');
    expect(tileLabels()[1]).toContain('Hàng đợi chấm');
    expect(tileLabels()[2]).toContain('Máy chấm trực tuyến');
  });

  it('gives a contest organiser the tile of tickets about their contests, without the problem tiles', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      'GET /tickets/summary': ok({ assignedOpen: 0, awaitingStaff: 0, aboutMineOpen: 2 }),
    });
    const { wrapper } = await mountApp('/admin');
    await waitForAdminShell(wrapper);
    await vi.waitFor(() => expect(wrapper.text()).toContain('Phiếu về bài của tôi'));
    expect(wrapper.text()).not.toContain('Bài chưa công khai');
    expect(calls.some((call) => call.path === '/admin/problems')).toBe(false);
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
