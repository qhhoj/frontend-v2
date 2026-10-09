import { describe, expect, it, vi } from 'vitest';
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

describe('AdminLogPage', () => {
  it('reads the revisions of the key in the URL, newest first, with restore', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.change_settings']),
      'GET /admin/settings/pdf.renderTimeoutMs/revisions': page(
        [settingRevision(30000, 45000), settingRevision(20000, 30000)],
        { pageSize: 20 },
      ),
    });
    const { wrapper } = await mountLog('/admin/log?key=pdf.renderTimeoutMs');
    await flushPromises();
    expect(
      calls.some((call) => call.path === '/admin/settings/pdf.renderTimeoutMs/revisions'),
    ).toBe(true);
    expect(wrapper.findAll('[data-testid="revision"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('Khôi phục');
    expect(wrapper.text()).toContain('Mới có một nguồn');
  });

  it('changes key from the select and keeps it in the URL', async () => {
    mockApi({
      ...staffViewer(['judge.change_settings']),
      'GET /admin/settings/site.timeZone/revisions': page([]),
      'GET /admin/settings/mail.smtpUrl/revisions': page([
        settingRevision({ set: false }, { set: true }),
      ]),
    });
    const { wrapper, router } = await mountLog('/admin/log');
    await wrapper.get('#log-key').setValue('mail.smtpUrl');
    await flushPromises();
    expect(router.currentRoute.value.query.key).toBe('mail.smtpUrl');
    expect(wrapper.text()).toContain('Không khôi phục được giá trị bí mật.');
  });

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
