import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { dataExportStatus } from '@/test/fixtures';
import { mockApi, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const requestButton = (wrapper: VueWrapper) => wrapper.get('#main button[data-request-export]');
async function openData(status: MockHandler, routes: Record<string, MockHandler> = {}) {
  const calls = mockApi({ ...settingsRoutes(), 'GET /profile/data': status, ...routes });
  const { wrapper } = await mountApp('/settings/data');
  return { wrapper, calls };
}

describe('Settings › Data', () => {
  it('requests a first export and then shows it running', async () => {
    const { wrapper, calls } = await openData(
      sequence(
        ok(dataExportStatus()),
        ok(
          dataExportStatus({
            state: 'preparing',
            preparedAt: new Date().toISOString(),
            canPrepare: false,
          }),
        ),
      ),
      { 'POST /profile/data': { status: 202, body: { data: { queued: true } } } },
    );
    expect(wrapper.text()).toContain('Chưa yêu cầu');
    expect(requestButton(wrapper).text()).toBe('Yêu cầu xuất dữ liệu');
    await requestButton(wrapper).trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST' && call.path === '/profile/data')).toBe(
      true,
    );
    expect(requestButton(wrapper).text()).toBe('Đang chuẩn bị…');
    expect(requestButton(wrapper).attributes('aria-disabled')).toBe('true');
  });

  it('is locked while viewing as another user: a notice under the padlock Bit, and no request for the export', async () => {
    // No 'GET /profile/data' route: an unmocked request would fail the test.
    const calls = mockApi(settingsRoutes({ impersonatorId: 'staff-1' }));
    const { wrapper } = await mountApp('/settings/data');
    expect(wrapper.get('#main').text()).toContain('Chỉ chủ tài khoản xuất được dữ liệu cá nhân.');
    expect(wrapper.find('#main [data-testid="inline-bit"][data-frame]').exists()).toBe(true);
    expect(wrapper.find('#main button[data-request-export]').exists()).toBe(false);
    expect(calls.some((call) => call.path.startsWith('/profile/data'))).toBe(false);
  });
});
