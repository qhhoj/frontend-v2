import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const LOCKED_ROW = '#main [data-locked-action]';
const sectionTitles = (wrapper: VueWrapper) =>
  wrapper.findAll('#main h2').map((heading) => heading.text());

describe('Settings › Security while viewing as someone', () => {
  it('shows only the locked notice, with no section and no input in it', async () => {
    mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/security');
    expect(sectionTitles(wrapper)).toEqual(['Bảo mật']);
    expect(wrapper.find('#main input').exists()).toBe(false);
    expect(wrapper.find('#main form').exists()).toBe(false);
    expect(wrapper.find('#main [role="dialog"]').exists()).toBe(false);
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
        call.path.startsWith('/auth/token') ||
        call.path === '/auth/logout-all',
    );
    expect(securityCalls).toEqual([]);
  });
});
