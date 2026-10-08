import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { dataExportStatus } from '@/test/fixtures';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
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

  it('offers a ready file as a plain download link, with a crowned Bit and the wait before the next request', async () => {
    const now = Date.now();
    const { wrapper } = await openData(
      ok(
        dataExportStatus({
          state: 'ready',
          preparedAt: new Date(now - 3 * 60_000).toISOString(),
          readyAt: new Date(now).toISOString(),
          expiresAt: new Date(now + 7 * 86_400_000).toISOString(),
          size: 19_293_798,
          nextPrepareAt: new Date(now + (21 * 60 + 14) * 60_000 - 30_000).toISOString(),
          canPrepare: false,
        }),
      ),
    );
    const link = wrapper.get('a[download]');
    expect(link.attributes('href')).toBe('/api/internal/profile/data/download');
    expect(wrapper.text()).toContain('user_01-data.zip');
    expect(wrapper.text()).toContain('18.3 MB');
    expect(wrapper.text()).toContain('(còn 7 ngày)');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Bạn có thể yêu cầu lại sau 21 giờ 14 phút.');
    expect(requestButton(wrapper).attributes('aria-describedby')).toBeDefined();
  });

  it('says the daily limit is used up', async () => {
    const { wrapper } = await openData(
      ok(dataExportStatus({ preparedAt: new Date().toISOString(), canPrepare: false })),
    );
    expect(wrapper.text()).toContain('Bạn đã dùng hết lượt yêu cầu hôm nay.');
  });

  it('says export is not available when the backend has none for this account, with no retry', async () => {
    const { wrapper } = await openData(fail(404, 'not_found'));
    expect(wrapper.text()).toContain('Xuất dữ liệu không khả dụng cho tài khoản này.');
    expect(wrapper.findAll('#main button').some((button) => button.text() === 'Thử lại')).toBe(
      false,
    );
  });

  it('explains a request refused because one is already running, with a sweating Bit', async () => {
    const { wrapper } = await openData(ok(dataExportStatus()), {
      'POST /profile/data': fail(409, 'conflict'),
    });
    await requestButton(wrapper).trigger('click');
    await flushPromises();
    const alert = wrapper.get('#main [role="alert"]');
    expect(alert.text()).toBe('Đang có một yêu cầu chạy: hãy chờ xong rồi thử lại.');
    expect(alert.find('[data-testid="inline-bit"]').exists()).toBe(true);
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
