import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { sessionResponse, sessionUser } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const banner = '[role="region"][aria-label="Đang xem dưới tên người khác"]';
const staff = sessionResponse({
  user: sessionUser({ id: 'staff-1', username: 'admin', isStaff: true }),
});

describe('ImpersonationBanner', () => {
  it('stops viewing and hands the page back to the staff account', async () => {
    const calls = mockApi({
      ...settingsRoutes({ impersonatorId: 'staff-1' }),
      'POST /auth/impersonate/stop': ok(staff),
    });
    const { wrapper } = await mountApp('/settings');
    await wrapper.get(`${banner} button`).trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path === '/auth/impersonate/stop')).toBe(true);
    expect(wrapper.find(banner).exists()).toBe(false);
    expect(wrapper.text()).toContain('admin');
  });

  it('says so when stopping fails, and stays', async () => {
    mockApi({
      ...settingsRoutes({ impersonatorId: 'staff-1' }),
      'POST /auth/impersonate/stop': fail(500, 'http_error'),
    });
    const { wrapper } = await mountApp('/settings');
    await wrapper.get(`${banner} button`).trigger('click');
    await flushPromises();
    expect(wrapper.get(`${banner} [role="alert"]`).text()).toBe('Đã có lỗi xảy ra. Hãy thử lại.');
  });
});
