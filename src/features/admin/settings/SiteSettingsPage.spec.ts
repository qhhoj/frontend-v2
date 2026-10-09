import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import {
  cancelDialog,
  confirmDialog,
  openDialog,
  staffViewer,
  switchNamed,
} from '@/test/admin-routes';
import { ALL_SETTINGS, setting, settingRevision } from '@/test/admin-fixtures/settings';

/** jsdom has no layout: the history panel's scroll is recorded, not performed. */
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

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

describe('keys that were hidden', () => {
  it('shows the official mode end time and the problem grace days with their labels', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(ALL_SETTINGS) }));
    const { wrapper } = await mountSettings();
    expect(wrapper.get('[data-block="contest"]').text()).toContain(
      'Thời điểm tự tắt chế độ thi chính thức',
    );
    expect(wrapper.get('[data-block="problem"]').text()).toContain(
      'Số ngày có thể khôi phục bài đã xóa',
    );
  });
});

const withMinPercent = (stored: number) =>
  ALL_SETTINGS.map((entry) =>
    entry.key === 'similarity.minPercent'
      ? setting('similarity.minPercent', stored, { default: 50, isDefault: stored === 50 })
      : entry,
  );
const keyRow = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], key: string) =>
  wrapper.get(`[data-key="${key}"]`);

describe('defaults', () => {
  it('fills the default into the box and sends nothing until "Lưu"', async () => {
    const calls = mockApi(
      routes({
        'GET /admin/settings': ok(withMinPercent(65)),
        'PATCH /admin/settings/similarity.minPercent': ok(
          setting('similarity.minPercent', 50, { default: 50, isDefault: true }),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const row = keyRow(wrapper, 'similarity.minPercent');
    await row.get('button[aria-label="Về mặc định 50"]').trigger('click');
    expect((row.get('input').element as HTMLInputElement).value).toBe('50');
    expect(row.text()).toContain('Đã điền giá trị mặc định, chưa lưu. Giá trị đang lưu: 65.');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await clickIn(block(wrapper, 'similarity'), 'Lưu');
    expect(
      calls.filter((call) => call.method === 'PATCH').map((call) => [call.path, call.body]),
    ).toEqual([['/admin/settings/similarity.minPercent', { value: 50 }]]);
  });

  it('disables the control while the box holds the default, and enables it after an edit', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(withMinPercent(50)) }));
    const { wrapper } = await mountSettings();
    const row = keyRow(wrapper, 'similarity.minPercent');
    const button = row.get('button[aria-label="Về mặc định 50"]');
    expect(button.attributes('aria-disabled')).toBe('true');
    await row.get('input').setValue('70');
    expect(button.attributes('aria-disabled')).toBeUndefined();
  });

  it('"Đặt lại" still discards the filled default and shows the stored value again', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(withMinPercent(65)) }));
    const { wrapper } = await mountSettings();
    const row = keyRow(wrapper, 'similarity.minPercent');
    await row.get('button[aria-label="Về mặc định 50"]').trigger('click');
    await clickIn(block(wrapper, 'similarity'), 'Đặt lại');
    expect((row.get('input').element as HTMLInputElement).value).toBe('65');
    expect(row.text()).not.toContain('Đã điền giá trị mặc định');
  });

  it('resets a switch to its default too', async () => {
    mockApi(
      routes({
        'GET /admin/settings': ok(
          ALL_SETTINGS.map((entry) =>
            entry.key === 'contest.officialMode'
              ? setting('contest.officialMode', true, { default: false, isDefault: false })
              : entry,
          ),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const row = keyRow(wrapper, 'contest.officialMode');
    await row.get('button[aria-label="Về mặc định tắt"]').trigger('click');
    expect(switchNamed(row, 'Bật chế độ kỳ thi chính thức').attributes('aria-checked')).toBe(
      'false',
    );
  });

  it('shows "Mặc định" or "Khác mặc định" per key, from the stored value', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(withMinPercent(65)) }));
    const { wrapper } = await mountSettings();
    const chip = (key: string) => keyRow(wrapper, key).get('[data-testid="default-chip"]').text();
    expect(chip('similarity.minPercent')).toBe('Khác mặc định');
    expect(chip('similarity.maxPairs')).toBe('Mặc định');
  });

  it('offers no reset on a key with a sealed part', async () => {
    mockApi(routes());
    const { wrapper } = await mountSettings();
    for (const key of ['mail.smtpUrl', 'auth.google', 'discord.webhooks'])
      expect(keyRow(wrapper, key).find('button[aria-label^="Về mặc định"]').exists(), key).toBe(
        false,
      );
  });
});

describe('clearing a secret', () => {
  const patches = (calls: { method: string; path: string; body: unknown }[]) =>
    calls.filter((call) => call.method === 'PATCH').map((call) => [call.path, call.body]);

  it('sends nothing until the dialog is confirmed, then PATCHes an empty value and shows the secret as unset', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/mail.smtpUrl': ok(setting('mail.smtpUrl', { set: false })),
      }),
    );
    const { wrapper } = await mountSettings();
    const mail = block(wrapper, 'mail');
    await clickIn(mail, 'Xoá bí mật');
    expect(openDialog().textContent).toContain('Xoá URL SMTP?');
    expect(openDialog().textContent).toContain('không khôi phục được');
    expect(openDialog().textContent).toContain('Người gửi (mail.from) không đổi.');
    expect(patches(calls)).toEqual([]);
    await confirmDialog('Xoá URL SMTP');
    expect(patches(calls)).toEqual([['/admin/settings/mail.smtpUrl', { value: '' }]]);
    expect(mail.text()).toContain('Chưa đặt');
    expect(mail.text()).toContain('Đã xoá URL SMTP.');
    expect(mail.findAll('button').some((button) => button.text() === 'Xoá bí mật')).toBe(false);
  });

  it('sends nothing when the dialog is cancelled', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'mail'), 'Xoá bí mật');
    await cancelDialog();
    expect(patches(calls)).toEqual([]);
  });

  it('switches an enabled social login off together with its secret', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/auth.google': ok(
          setting('auth.google', {
            enabled: false,
            clientId: '1048',
            clientSecret: { set: false },
          }),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'google'), 'Xoá bí mật');
    expect(openDialog().textContent).toContain('bị tắt cùng lúc');
    await confirmDialog('Xoá bí mật máy khách Google');
    expect(patches(calls)).toEqual([
      ['/admin/settings/auth.google', { value: { enabled: false, clientSecret: '' } }],
    ]);
  });

  it('empties the webhook list', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/discord.webhooks': ok(setting('discord.webhooks', { set: false })),
      }),
    );
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'discord'), 'Xoá bí mật');
    await confirmDialog('Xoá danh sách webhook Discord');
    expect(patches(calls)).toEqual([['/admin/settings/discord.webhooks', { value: {} }]]);
  });

  it('offers no clear for a secret that is not set', async () => {
    mockApi(routes());
    const { wrapper } = await mountSettings();
    expect(
      block(wrapper, 'github')
        .findAll('button')
        .some((button) => button.text() === 'Xoá bí mật'),
    ).toBe(false);
  });

  it('keeps the dialog open and says why when the server refuses', async () => {
    mockApi(routes({ 'PATCH /admin/settings/mail.smtpUrl': fail(403, 'forbidden') }));
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'mail'), 'Xoá bí mật');
    await confirmDialog('Xoá URL SMTP');
    expect(openDialog().textContent).toContain('Bạn không có quyền làm việc này.');
    expect(block(wrapper, 'mail').text()).not.toContain('Đã xoá URL SMTP.');
  });

  it('leaves an unsaved edit of another key in the block alone', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/mail.smtpUrl': ok(setting('mail.smtpUrl', { set: false })),
      }),
    );
    const { wrapper } = await mountSettings();
    const mail = block(wrapper, 'mail');
    await mail.get('input').setValue('QHHOJ <ops@qhhoj.example>');
    await clickIn(mail, 'Xoá bí mật');
    await confirmDialog('Xoá URL SMTP');
    expect((mail.get('input').element as HTMLInputElement).value).toBe('QHHOJ <ops@qhhoj.example>');
    expect(patches(calls)).toEqual([['/admin/settings/mail.smtpUrl', { value: '' }]]);
  });
});

describe('webhooks', () => {
  const patchesOf = (calls: { method: string; path: string; body: unknown }[]) =>
    calls.filter((call) => call.method === 'PATCH').map((call) => [call.path, call.body]);

  it('saves one https URL per event, the shape the backend parses', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/discord.webhooks': ok(setting('discord.webhooks', { set: true })),
      }),
    );
    const { wrapper } = await mountSettings();
    const discord = block(wrapper, 'discord');
    await clickIn(discord, 'Thay thế');
    await discord.get('input[type="url"]').setValue('https://discord.example/1');
    await clickIn(discord, 'Lưu');
    expect(patchesOf(calls)).toEqual([
      ['/admin/settings/discord.webhooks', { value: { default: 'https://discord.example/1' } }],
    ]);
  });

  it('"Thay thế" with an empty URL sends nothing, so the stored list is kept', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    const discord = block(wrapper, 'discord');
    await clickIn(discord, 'Thay thế');
    await clickIn(discord, 'Lưu');
    expect(patchesOf(calls)).toEqual([]);
  });
});

describe('saving a replaced secret', () => {
  it('closes the replace box after a saved replacement, so a later "Lưu" never sends it again', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/mail.smtpUrl': ok(setting('mail.smtpUrl', { set: true })),
      }),
    );
    const { wrapper } = await mountSettings();
    const mail = block(wrapper, 'mail');
    await clickIn(mail, 'Thay thế');
    await mail.get('input[type="password"]').setValue('smtps://u:p@h');
    await clickIn(mail, 'Lưu');
    expect(mail.find('input[type="password"]').exists()).toBe(false);
    expect(mail.text()).toContain('Đã lưu.');
    await clickIn(mail, 'Lưu');
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
  });

  it('says so when "Lưu" has nothing to save', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'site'), 'Lưu');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(block(wrapper, 'site').text()).toContain('Không có thay đổi.');
  });
});

describe('history panel', () => {
  const pdfHistoryButton = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
    block(wrapper, 'pdf')
      .findAll('button')
      .find((button) => button.text() === 'Lịch sử · pdf.renderTimeoutMs')!;

  it('opening a key scrolls the panel into view and focuses its heading; Đóng gives focus back to its button', async () => {
    mockApi(
      routes({
        'GET /admin/settings/pdf.renderTimeoutMs/revisions': page([settingRevision(30000, 45000)], {
          pageSize: 20,
        }),
      }),
    );
    const { wrapper } = await mountSettings();
    await pdfHistoryButton(wrapper).trigger('click');
    await flushPromises();
    const panel = wrapper.get('[data-testid="revisions"]');
    expect(document.activeElement).toBe(panel.get('h2').element);
    expect(scrollIntoView).toHaveBeenCalled();
    await panel
      .findAll('button')
      .find((button) => button.text() === 'Đóng')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="revisions"]').exists()).toBe(false);
    expect(document.activeElement).toBe(pdfHistoryButton(wrapper).element);
  });
});
