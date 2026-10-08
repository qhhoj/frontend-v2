import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BitLoop from '@/components/BitLoop.vue';
import { settingsRoutes } from '@/test/account-routes';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const LOCKED_ROW = '#main [data-locked-action]';
const sectionTitles = (wrapper: VueWrapper) =>
  wrapper.findAll('#main h2').map((heading) => heading.text());

describe('Settings › Security (normal view)', () => {
  it('shows the four sections in order, each with its own controls', async () => {
    mockApi(settingsRoutes());
    const { wrapper } = await mountApp('/settings/security');
    expect(sectionTitles(wrapper)).toEqual([
      'Đổi mật khẩu',
      'Xác thực hai bước',
      'API token',
      'Đăng xuất mọi nơi',
    ]);
    expect(wrapper.find('input[name="currentPassword"]').exists()).toBe(true);
    expect(wrapper.find(LOCKED_ROW).exists()).toBe(false);
  });
});

describe('Settings › Security while viewing as someone', () => {
  it('shows only the locked notice, with no section and no input in it', async () => {
    mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/security');
    expect(sectionTitles(wrapper)).toEqual(['Bảo mật']);
    expect(wrapper.find('#main input').exists()).toBe(false);
    expect(wrapper.find('#main form').exists()).toBe(false);
    expect(wrapper.find('#main [role="dialog"]').exists()).toBe(false);
  });

  it('lists the four owner-only actions, each disabled with its reason', async () => {
    mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/security');
    const rows = wrapper.findAll(LOCKED_ROW);
    expect(rows.map((row) => row.get('button').text())).toEqual([
      'Đổi mật khẩu',
      'Bật',
      'Tạo token mới',
      'Đăng xuất mọi nơi',
    ]);
    for (const row of rows) expect(row.get('button').attributes('disabled')).toBeDefined();
    for (const row of rows.slice(0, 3)) {
      expect(row.text()).toContain('Không dùng được khi đang xem dưới tên người khác.');
    }
    expect(rows[3]!.text()).toContain('đăng xuất chủ tài khoản khỏi mọi thiết bị');
  });

  it('shows the padlock Bit on the notice', async () => {
    mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/security');
    expect(wrapper.findComponent(BitLoop).props('kind')).toBe('security');
  });

  it('sends no request to any account-security route', async () => {
    const calls = mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/security');
    await flushPromises();
    expect(wrapper.find(LOCKED_ROW).exists()).toBe(true);
    const securityCalls = calls.filter(
      (call) =>
        call.path.startsWith('/auth/2fa') ||
        call.path.startsWith('/auth/password') ||
        call.path.startsWith('/auth/api-token') ||
        call.path === '/auth/logout-all',
    );
    expect(securityCalls).toEqual([]);
  });
});
