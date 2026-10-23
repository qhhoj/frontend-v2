import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, invalid, issue, mockApi, noContent, ok, page } from '@/test/mock-api';
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
  'GET /admin/discord-webhooks': ok([]),
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
const keyRow = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], key: string) =>
  wrapper.get(`[data-key="${key}"]`);
/** Opens a key's ⓘ popover, which holds its history and reset; it renders in the body, outside the row. */
const openInfo = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], key: string) => {
  await keyRow(wrapper, key).get('[data-testid="setting-info"]').trigger('click');
  await flushPromises();
  return document.body.querySelector<HTMLElement>(
    `[role="dialog"][aria-label="Thông tin ${key}"]`,
  )!;
};
const clickButton = async (button: Element | null | undefined) => {
  (button as HTMLElement).click();
  await flushPromises();
};
const buttonNamed = (scope: HTMLElement, text: string) =>
  [...scope.querySelectorAll('button')].find((button) => button.textContent?.trim() === text);
/** The page's one save bar. */
const saveBar = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.get('[data-testid="settings-save-bar"]');
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
    expect(saveBar(wrapper).text()).toContain('2 thay đổi chưa lưu');
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
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
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.path)).toEqual([
      '/admin/settings/contest.officialMode',
    ]);
    expect(contest.get('[role="alert"]').text()).toContain('contest.officialMode');
  });

  it('shows the backend refusal under its block and keeps the edit', async () => {
    mockApi(
      routes({
        'PATCH /admin/settings/site.timeZone': invalid(
          issue('value', 'time_zone_invalid', 'Not an IANA time zone.'),
        ),
      }),
    );
    const { wrapper } = await mountSettings();
    const site = block(wrapper, 'site');
    await site.get('input').setValue('Mars/Base');
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    expect(site.get('[role="alert"]').text()).toContain(
      'Múi giờ không hợp lệ. Hãy chọn một múi giờ trong danh sách (ví dụ Asia/Ho_Chi_Minh).',
    );
    expect((site.get('input').element as HTMLInputElement).value).toBe('Mars/Base');
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
    await clickButton(buttonNamed(await openInfo(wrapper, 'pdf.renderTimeoutMs'), 'Lịch sử'));
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
});

const withMinPercent = (stored: number) =>
  ALL_SETTINGS.map((entry) =>
    entry.key === 'similarity.minPercent'
      ? setting('similarity.minPercent', stored, { default: 50, isDefault: stored === 50 })
      : entry,
  );

describe('defaults', () => {
  it('"Hủy thay đổi" still discards the filled default and shows the stored value again', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(withMinPercent(65)) }));
    const { wrapper } = await mountSettings();
    const row = keyRow(wrapper, 'similarity.minPercent');
    const info = await openInfo(wrapper, 'similarity.minPercent');
    await clickButton(info.querySelector('button[aria-label="Về mặc định 50"]'));
    await clickIn(saveBar(wrapper), 'Hủy thay đổi');
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
    const info = await openInfo(wrapper, 'contest.officialMode');
    await clickButton(info.querySelector('button[aria-label="Về mặc định tắt"]'));
    expect(switchNamed(row, 'Bật chế độ kỳ thi chính thức').attributes('aria-checked')).toBe(
      'false',
    );
  });
});

describe('the ⓘ popover', () => {
  it('is a named dialog, takes focus on open and gives it back to the ⓘ after a reset', async () => {
    mockApi(routes({ 'GET /admin/settings': ok(withMinPercent(65)) }));
    const { wrapper } = await mountSettings();
    const info = await openInfo(wrapper, 'similarity.minPercent');
    expect(document.activeElement).toBe(buttonNamed(info, 'Lịch sử'));
    await clickButton(info.querySelector('button[aria-label="Về mặc định 50"]'));
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('info-similarity.minPercent'));
  });

  it('leaves focus on the history heading it opened', async () => {
    mockApi(
      routes({
        'GET /admin/settings/pdf.renderTimeoutMs/revisions': page([], { pageSize: 20 }),
      }),
    );
    const { wrapper } = await mountSettings();
    await clickButton(buttonNamed(await openInfo(wrapper, 'pdf.renderTimeoutMs'), 'Lịch sử'));
    await flushPromises();
    expect(wrapper.get('[data-testid="revisions"]').element.contains(document.activeElement)).toBe(
      true,
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
    await clickIn(mail, 'Xóa bí mật');
    expect(openDialog().textContent).toContain('Xóa URL SMTP?');
    expect(openDialog().textContent).toContain('không khôi phục được');
    expect(openDialog().textContent).toContain('Người gửi (mail.from) không đổi.');
    expect(patches(calls)).toEqual([]);
    await confirmDialog('Xóa URL SMTP');
    expect(patches(calls)).toEqual([['/admin/settings/mail.smtpUrl', { value: '' }]]);
    expect(mail.text()).toContain('Chưa đặt');
    expect(mail.text()).toContain('Đã xóa URL SMTP.');
    expect(mail.findAll('button').some((button) => button.text() === 'Xóa bí mật')).toBe(false);
  });

  it('sends nothing when the dialog is cancelled', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'mail'), 'Xóa bí mật');
    await cancelDialog();
    expect(patches(calls)).toEqual([]);
  });

  it('keeps the dialog open and says why when the server refuses', async () => {
    mockApi(routes({ 'PATCH /admin/settings/mail.smtpUrl': fail(403, 'forbidden') }));
    const { wrapper } = await mountSettings();
    await clickIn(block(wrapper, 'mail'), 'Xóa bí mật');
    await confirmDialog('Xóa URL SMTP');
    expect(openDialog().textContent).toContain('Bạn không có quyền làm việc này.');
    expect(block(wrapper, 'mail').text()).not.toContain('Đã xóa URL SMTP.');
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
    await clickIn(mail, 'Xóa bí mật');
    await confirmDialog('Xóa URL SMTP');
    expect((mail.get('input').element as HTMLInputElement).value).toBe('QHHOJ <ops@qhhoj.example>');
    expect(patches(calls)).toEqual([['/admin/settings/mail.smtpUrl', { value: '' }]]);
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
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    expect(mail.find('input[type="password"]').exists()).toBe(false);
    expect(saveBar(wrapper).text()).toContain('Đã lưu lúc');
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
  });
});

describe('one save bar for every tab', () => {
  it('counts unsaved keys per tab, keeps them across a tab switch and saves every changed block', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/site.timeZone': ok(setting('site.timeZone', 'UTC')),
        'PATCH /admin/settings/similarity.minPercent': ok(setting('similarity.minPercent', 70)),
      }),
    );
    const { wrapper, router } = await mountSettings();
    await block(wrapper, 'site').get('input').setValue('UTC');
    await router.push('/admin/settings?tab=limits');
    await flushPromises();
    await keyRow(wrapper, 'similarity.minPercent').get('input').setValue('70');
    expect(wrapper.get('[data-testid="settings-tab-general"]').text()).toContain('1');
    expect(wrapper.get('[data-testid="settings-tab-limits"]').text()).toContain('1');
    expect(saveBar(wrapper).text()).toContain('2 thay đổi chưa lưu');
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.path)).toEqual([
      '/admin/settings/site.timeZone',
      '/admin/settings/similarity.minPercent',
    ]);
    expect(wrapper.get('[data-testid="settings-tab-general"]').text()).not.toContain('1');
  });

  it('saves the other blocks past a refused one and opens the refused block’s tab', async () => {
    const calls = mockApi(
      routes({
        'PATCH /admin/settings/site.timeZone': invalid(issue('value', 'time_zone_invalid', 'Bad zone.')),
        'PATCH /admin/settings/similarity.minPercent': ok(setting('similarity.minPercent', 70)),
      }),
    );
    const { wrapper, router } = await mountSettings();
    await block(wrapper, 'site').get('input').setValue('Mars/Base');
    await router.push('/admin/settings?tab=limits');
    await flushPromises();
    await keyRow(wrapper, 'similarity.minPercent').get('input').setValue('70');
    await clickIn(saveBar(wrapper), 'Lưu thay đổi');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(2);
    expect(router.currentRoute.value.query.tab).toBe('general');
    expect(block(wrapper, 'site').get('[role="alert"]').text()).toContain(
      'Múi giờ không hợp lệ. Hãy chọn một múi giờ trong danh sách (ví dụ Asia/Ho_Chi_Minh).',
    );
    expect(saveBar(wrapper).text()).toContain('1 thay đổi chưa lưu');
  });

  it('keeps "Lưu thay đổi" disabled while nothing changed', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountSettings();
    const save = saveBar(wrapper)
      .findAll('button')
      .find((button) => button.text() === 'Lưu thay đổi')!;
    expect(save.attributes('aria-disabled')).toBe('true');
    await save.trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });
});

describe('search', () => {
  it('shows the matching rows of every tab, and the tabs again once the box is empty', async () => {
    mockApi(routes());
    const { wrapper } = await mountSettings();
    const search = wrapper.get('input[type="search"]');
    await search.setValue('mail.from');
    expect(keyRow(wrapper, 'mail.from').isVisible()).toBe(true);
    expect(keyRow(wrapper, 'mail.smtpUrl').isVisible()).toBe(false);
    expect(block(wrapper, 'site').isVisible()).toBe(false);
    expect(wrapper.text()).toContain('1 cài đặt khớp');
    await search.setValue('');
    expect(block(wrapper, 'site').isVisible()).toBe(true);
    expect(keyRow(wrapper, 'mail.from').isVisible()).toBe(false);
  });
});

describe('the site notice tab', () => {
  const noticeRoutes = (notice: string | null, extra = {}) =>
    routes({
      ...staffViewer([...PERMS, 'judge.change_miscconfig']),
      'GET /site': ok({
        officialMode: false,
        officialModeEndsAt: null,
        config: notice === null ? {} : { top_notification: notice },
      }),
      ...extra,
    });
  const mountNotice = async () => {
    const mounted = await mountApp('/admin/settings?tab=public');
    await vi.waitFor(() => {
      if (!mounted.wrapper.find('[data-block="notice"]').exists()) throw new Error('not yet');
    });
    return mounted;
  };

  it('publishes the notice from the one save bar', async () => {
    const calls = mockApi(
      noticeRoutes(null, {
        'PUT /admin/site/config/top_notification': ok({
          key: 'top_notification',
          value: 'Bảo trì',
        }),
      }),
    );
    const { wrapper } = await mountNotice();
    await block(wrapper, 'notice').get('textarea').setValue('  Bảo trì  ');
    expect(saveBar(wrapper).text()).toContain('1 thay đổi chưa lưu');
    await saveBar(wrapper).get('button[type="submit"]').trigger('click');
    await flushPromises();
    const put = calls.find((call) => call.method === 'PUT')!;
    expect(put.path).toBe('/admin/site/config/top_notification');
    expect(put.body).toEqual({ value: 'Bảo trì' });
  });

  it('takes the notice down when the box is emptied and saved', async () => {
    const calls = mockApi(
      noticeRoutes('Bảo trì', {
        'DELETE /admin/site/config/top_notification': noContent(),
      }),
    );
    const { wrapper } = await mountNotice();
    await clickIn(block(wrapper, 'notice'), 'Gỡ thông báo');
    await saveBar(wrapper).get('button[type="submit"]').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });
});
