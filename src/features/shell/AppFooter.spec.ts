import { describe, expect, it } from 'vitest';
import { partialSession, signedIn, signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp } from '@/test/mount';
import { useLowPowerStore } from '@/theme/low-power.store';

const openBlog = async () => {
  mockApi({ ...blogListRoutes, 'GET /auth/me': signedOut });
  return mountApp('/blog');
};

describe('AppFooter', () => {
  it('shows the low-power state and links to the switch', async () => {
    const { wrapper } = await openBlog();
    const footer = wrapper.get('[data-testid="app-footer"]');
    expect(footer.text()).toContain('Chế độ tiết kiệm: Tự động (tắt)');
    const link = footer.get('[data-testid="low-power-footer"]');
    expect(link.attributes('href')).toBe('/settings/appearance#low-power');
    expect(link.attributes('aria-label')).toBe('Đổi chế độ tiết kiệm');
  });

  it('follows a change of the choice', async () => {
    const { wrapper } = await openBlog();
    useLowPowerStore().choose('on');
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="app-footer"]').text()).toContain('Chế độ tiết kiệm: Bật');
  });

  it('is absent on the second-factor page (auth layout)', async () => {
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper } = await mountApp('/login/2fa');
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });
});
