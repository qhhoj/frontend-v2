import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { ALL_SETTINGS, setting, settingRevision } from '@/test/admin-fixtures/settings';

const PERMS = ['judge.change_settings'];
const routes = (extra = {}) => ({
  ...staffViewer(PERMS),
  'GET /admin/settings': ok(ALL_SETTINGS),
  ...extra,
});
/** AdminShell and the screens load lazily: wait until the first settings block is in the DOM. */
const mountSettings = async () => {
  const mounted = await mountApp('/admin/settings');
  await vi.waitFor(() => {
    if (!mounted.wrapper.find('[data-block]').exists()) throw new Error('screen not yet');
  });
  return mounted;
};
const block = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], id: string) =>
  wrapper.get(`[data-block="${id}"]`);
const clickIn = async (scope: ReturnType<typeof block>, text: string) => {
  await scope
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};

describe('SiteSettingsPage', () => {
  it('saves both keys of a block that changed, in order', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/contest.officialMode': ok(setting('contest.officialMode', true)),
        'PATCH /admin/settings/contest.banAfterDisqualifications': ok(
          setting('contest.banAfterDisqualifications', 3),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const contest = block(wrapper, 'contest');
    await contest.get('[role="switch"]').trigger('click');
    // The number box is bound with `v-model.number`: setValue('3') must reach the draft as the number 3, not the string '3'.
    await contest.get('input[type="number"]').setValue('3');
    await clickIn(contest, 'Lưu');
    expect(
      calls.filter((call) => call.method === 'PATCH').map((call) => [call.path, call.body]),
    ).toEqual([
      ['/admin/settings/contest.officialMode', { value: true }],
      ['/admin/settings/contest.banAfterDisqualifications', { value: 3 }],
    ]);
  });

  it('stops at the first refused key of a block and does not send the rest', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/contest.officialMode': invalid(
          issue('value', 'invalid', 'Rejected.'),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const contest = block(wrapper, 'contest');
    await contest.get('[role="switch"]').trigger('click');
    await contest.get('input[type="number"]').setValue('3');
    await clickIn(contest, 'Lưu');
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.path)).toEqual([
      '/admin/settings/contest.officialMode',
    ]);
    expect(contest.get('[role="alert"]').text()).toContain('contest.officialMode');
  });

  it('shows the backend refusal under its block and keeps the edit', async () => {
    mockApi(
      routes({
        'PATCH /admin/settings/site.timeZone': invalid(
          issue('value', 'invalid', 'Not an IANA time zone.'),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const site = block(wrapper, 'site');
    await site.get('input').setValue('Mars/Base');
    await clickIn(site, 'Lưu');
    expect(site.get('[role="alert"]').text()).toContain('Not an IANA time zone.');
    expect((site.get('input').element as HTMLInputElement).value).toBe('Mars/Base');
  });

  it('shows a sealed secret as set, and offers to replace it', async () => {
    mockApi(routes());
    const { wrapper } = await mountSettings();
    const mail = block(wrapper, 'mail');
    expect(mail.text()).toContain('Đã đặt');
    expect(mail.find('input[type="password"]').exists()).toBe(false);
    await clickIn(mail, 'Thay thế');
    expect(mail.find('input[type="password"]').exists()).toBe(true);
  });

  it('keeps the SMTP URL when "Thay thế" is opened and saved with an empty box', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    const mail = block(wrapper, 'mail');
    await clickIn(mail, 'Thay thế');
    await clickIn(mail, 'Lưu');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('opens a key’s history and restores through the restore endpoint, with no value of its own', async () => {
    const calls = mockApi(
      routes({
        'GET /admin/settings/pdf.renderTimeoutMs/revisions': page([settingRevision(30000, 45000)], {
          pageSize: 20,
        }),
        'POST /admin/settings/pdf.renderTimeoutMs/revisions/rev-1/restore': ok(
          setting('pdf.renderTimeoutMs', 30000),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    // The pdf block holds two keys, so each history button names its key.
    await clickIn(block(wrapper, 'pdf'), 'Lịch sử · pdf.renderTimeoutMs');
    expect(wrapper.get('[data-testid="revisions"]').text()).toContain('− 30000');
    await wrapper
      .get('[data-testid="revisions"]')
      .findAll('button')
      .find((button) => button.text() === 'Khôi phục')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/restore'))).toBe(false);
    await confirmDialog('Khôi phục');
    const restore = calls.find((call) => call.path.endsWith('/restore'))!;
    expect(restore.method).toBe('POST');
    expect(restore.body).toBeUndefined();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('offers no restore for a whole-secret key, so the server’s 409 is never provoked', async () => {
    mockApi(
      routes({
        'GET /admin/settings/mail.smtpUrl/revisions': page(
          [settingRevision({ set: true }, { set: true })],
          { pageSize: 20 },
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'mail'), 'Lịch sử · mail.smtpUrl');
    expect(wrapper.get('[data-testid="revisions"]').text()).toContain(
      'Không khôi phục được giá trị bí mật.',
    );
    expect(
      wrapper
        .get('[data-testid="revisions"]')
        .findAll('button')
        .some((button) => button.text() === 'Khôi phục'),
    ).toBe(false);
  });

  it('counts the blocks of a group from the blocks actually shown', async () => {
    mockApi(
      routes({
        'GET /admin/settings': ok(
          ALL_SETTINGS.filter((entry) => !['auth.github', 'auth.facebook'].includes(entry.key)),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    expect(wrapper.get('a[href="#settings-auth"]').text()).toContain('2');
    expect(wrapper.findAll('#settings-auth [data-block]')).toHaveLength(2);
  });
});
