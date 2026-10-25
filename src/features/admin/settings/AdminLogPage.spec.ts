import { beforeAll, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { settingRevision } from '@/test/admin-fixtures/settings';

/** AdminShell and the screens load lazily: wait until the log's key select is in the DOM. */
const mountLog = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.find('#log-key').exists()) throw new Error('screen not yet');
  });
  return mounted;
};

/** The first mount loads the admin shell and every screen module (seconds on a loaded machine): do it once here, not inside the test's limit. */
beforeAll(async () => {
  mockApi({
    ...staffViewer(['judge.change_settings']),
    'GET /admin/settings/mail.from/revisions': page([]),
  });
  (await mountLog('/admin/log?key=mail.from')).wrapper.unmount();
}, 60_000);

describe('AdminLogPage', () => {
  it('a different key starts its history on the first page', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.change_settings']),
      'GET /admin/settings/mail.from/revisions': page([settingRevision('a', 'b')], {
        total: 45,
        pageSize: 20,
      }),
      'GET /admin/settings/site.timeZone/revisions': page([settingRevision('x', 'y')], {
        total: 3,
        pageSize: 20,
      }),
    });
    const { wrapper } = await mountLog('/admin/log?key=mail.from');
    await flushPromises();
    await wrapper
      .get('[data-testid="revisions"]')
      .findAll('button')
      .find((button) => button.text() === 'Sau')!
      .trigger('click');
    await flushPromises();
    await wrapper.get('#log-key').setValue('site.timeZone');
    await flushPromises();
    const requestedPages = calls
      .filter((call) => call.path === '/admin/settings/site.timeZone/revisions')
      .map((call) => call.query.get('page'));
    expect(requestedPages.at(-1)).toBe('1');
  });
});
