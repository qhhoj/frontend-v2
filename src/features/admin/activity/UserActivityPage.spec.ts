import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { activityLog, activitySummary, liveActivity } from '@/test/admin-fixtures/activity';

const PERMS = ['judge.can_see_user_activity'];

/** AdminShell and the screens load lazily: wait until the screen's own content is in the DOM. */
const mountScreen = async (
  path: string,
  isReady: (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => boolean,
) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!isReady(mounted.wrapper)) throw new Error('screen not yet');
  });
  return mounted;
};
const routes = (extra = {}) => ({
  ...staffViewer(PERMS),
  'GET /admin/user-activity/logs': {
    body: {
      data: [
        activityLog(),
        activityLog({ id: 'l-2', username: null, path: '/wp-login.php', statusCode: 404 }),
      ],
      meta: { page: 1, pageSize: 50, hasMore: true },
    },
  },
  'GET /admin/user-activity/live': ok(liveActivity()),
  ...extra,
});

describe('UserActivityPage', () => {
  it('asks with the URL filter, shows guests as "khách" and links the CSV with the same filter', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountScreen('/admin/activity?ip=27.69&days=30', (view) =>
      view.find('a[download]').exists(),
    );
    const request = calls.find((call) => call.path === '/admin/user-activity/logs')!;
    expect(request.query.get('ip')).toBe('27.69');
    expect(request.query.get('days')).toBe('30');
    expect(wrapper.text()).toContain('khách');
    expect(wrapper.get('a[download]').attributes('href')).toBe(
      '/api/internal/admin/user-activity/logs/export?ip=27.69&days=30',
    );
    expect(wrapper.text()).toContain('chưa biết tổng số');
  });

  it('offers no next page past the last one the backend accepts (page 200)', async () => {
    const calls = mockApi(
      routes({
        'GET /admin/user-activity/logs': ({ query }: { query: URLSearchParams }) => ({
          body: {
            data: [activityLog()],
            meta: { page: Number(query.get('page')), pageSize: 50, hasMore: true },
          },
        }),
      }),
    );
    const { wrapper } = await mountScreen('/admin/activity', (view) =>
      view.find('a[download]').exists(),
    );
    await vi.waitFor(() => expect(wrapper.text()).toContain('Sau'));
    const next = () => wrapper.findAll('button').find((button) => button.text() === 'Sau');
    for (let step = 1; step < 200; step += 1) {
      await next()!.trigger('click');
      await vi.waitFor(() =>
        expect(
          calls
            .filter((call) => call.path.endsWith('/logs'))
            .at(-1)!
            .query.get('page'),
        ).toBe(String(step + 1)),
      );
      await flushPromises();
    }
    expect(next()).toBeUndefined();
  }, 60_000);

  it('opens a user summary and deletes their log only after a named confirm', async () => {
    const calls = mockApi(
      routes({
        'GET /admin/user-activity/users/tuan_k/summary': ok(activitySummary()),
        'DELETE /admin/user-activity/users/tuan_k': { status: 204 },
      }),
    );
    const { wrapper } = await mountScreen('/admin/activity?summary=tuan_k', (view) =>
      view.find('[data-testid="user-summary"]').exists(),
    );
    // vi groups thousands with a dot: formatNumber(3482, 'vi') is 3.482, not "3 482" as the board's drawing has it.
    expect(wrapper.get('[data-testid="user-summary"]').text()).toContain('3.482 yêu cầu');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Xoá nhật ký của tuan_k')!
      .trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('không hoàn tác');
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('tuan_k');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xoá');
    expect(
      calls.some((call) => call.method === 'DELETE' && call.path.endsWith('/users/tuan_k')),
    ).toBe(true);
  });

  it('deletes the guests’ log through its own confirm', async () => {
    const calls = mockApi(routes({ 'DELETE /admin/user-activity/anonymous': { status: 204 } }));
    const { wrapper } = await mountScreen('/admin/activity', (view) =>
      view.text().includes('Xoá nhật ký khách'),
    );
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Xoá nhật ký khách')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xoá');
    expect(calls.some((call) => call.path === '/admin/user-activity/anonymous')).toBe(true);
  });
});
