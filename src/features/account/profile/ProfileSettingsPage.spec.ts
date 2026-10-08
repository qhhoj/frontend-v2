import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { profile, profileOrganization } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, ok, sequence } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const patches = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
const echo: MockHandler = ({ body }) => ok(profile({ firstName: 'Thư', ...(body as object) }));
const nameInput = (wrapper: VueWrapper) => wrapper.get<HTMLInputElement>('input[name="firstName"]');
const saveButton = (wrapper: VueWrapper) => wrapper.get('button[type="submit"]');
const alertText = (wrapper: VueWrapper) => wrapper.get('#main [role="alert"]').text();
const summaryTitle = (wrapper: VueWrapper) => wrapper.get('#main [role="alert"] h3').text();
const summaryElement = (wrapper: VueWrapper) => wrapper.get('#main [role="alert"]').element;

async function openProfile(routes: Record<string, MockHandler> = {}, about = '') {
  const calls = mockApi({
    ...settingsRoutes(
      {},
      { firstName: 'Thư', about, aboutHtml: about && '<p>Học sinh lớp 11</p>' },
    ),
    'PATCH /profile': echo,
    ...routes,
  });
  const { wrapper } = await mountApp('/settings');
  return { wrapper, calls };
}

describe('Settings › Profile', () => {
  it('shows the stored name with its count, the username note and a clean save bar', async () => {
    const { wrapper } = await openProfile();
    expect(nameInput(wrapper).element.value).toBe('Thư');
    expect(wrapper.text()).toContain('3 / 30');
    expect(wrapper.text()).toContain('Tên đăng nhập user_01 không đổi được.');
    expect(wrapper.text()).toContain('Không có thay đổi chưa lưu.');
    expect(saveButton(wrapper).attributes('aria-disabled')).toBe('true');
  });

  it('saves only the edited field and says so', async () => {
    const { wrapper, calls } = await openProfile();
    await nameInput(wrapper).setValue('Trần Minh Thư');
    expect(wrapper.text()).toContain('Có thay đổi chưa lưu.');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(patches(calls)).toEqual([{ firstName: 'Trần Minh Thư' }]);
    expect(wrapper.get('#main [role="status"]').text()).toBe('Đã lưu hồ sơ.');
    expect(wrapper.find('#main [role="status"] [data-testid="inline-bit"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Không có thay đổi chưa lưu.');
  });

  it('counts an over-long name as it is typed, sends nothing, names the field and focuses it', async () => {
    const { wrapper, calls } = await openProfile();
    await nameInput(wrapper).setValue('Trần Minh Thư (lớp 11A1, chuyên Tin)');
    expect(wrapper.text()).toContain('36 / 30');
    expect(wrapper.text()).toContain('Tên hiển thị tối đa 30 ký tự (đang dùng 36).');
    expect(nameInput(wrapper).attributes('aria-invalid')).toBe('true');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(patches(calls)).toEqual([]);
    expect(summaryTitle(wrapper)).toBe(
      'Chưa lưu được. Có 1 mục cần sửa: Tên hiển thị. Các thay đổi khác của bạn vẫn còn trên trang.',
    );
    expect(wrapper.text()).toContain('Sửa 1 lỗi rồi bấm Lưu lại.');
    expect(wrapper.find('#main [role="alert"] [data-testid="inline-bit"]').exists()).toBe(true);
    expect(document.activeElement).toBe(summaryElement(wrapper));
  });

  it('shows an over-long about text in the write tab even when the saved tab was open', async () => {
    const { wrapper } = await openProfile();
    await wrapper.get('[role="tab"]:nth-child(2)').trigger('click');
    await wrapper.get('textarea').setValue('x'.repeat(65_537));
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Soạn thảo');
    expect(document.activeElement).toBe(summaryElement(wrapper));
  });

  it('puts a server field error under its field, in Vietnamese, and keeps the edit', async () => {
    const { wrapper } = await openProfile({
      'PATCH /profile': invalid(
        issue(
          'firstName',
          'max_length',
          'firstName must be shorter than or equal to 30 characters',
        ),
      ),
    });
    await nameInput(wrapper).setValue('Minh Thư');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Tên hiển thị chưa hợp lệ.');
    expect(wrapper.text()).not.toContain('firstName must be shorter');
    expect(nameInput(wrapper).element.value).toBe('Minh Thư');
  });

  it('explains a locked profile instead of "no permission"', async () => {
    const { wrapper } = await openProfile({ 'PATCH /profile': fail(403, 'forbidden') });
    await nameInput(wrapper).setValue('Minh Thư');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(alertText(wrapper)).toMatch(/^Chưa lưu được tên hoặc phần giới thiệu/);
  });

  it('offers a retry when the connection drops, and the retry sends the same change', async () => {
    const { wrapper, calls } = await openProfile();
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      init?.method === 'PATCH' ? Promise.reject(new TypeError('offline')) : answer(input, init),
    );
    await nameInput(wrapper).setValue('Minh Thư');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(alertText(wrapper)).toMatch(/^Mất kết nối/);
    vi.stubGlobal('fetch', answer);
    await wrapper.get('#main [role="alert"] button').trigger('click');
    await flushPromises();
    expect(patches(calls)).toEqual([{ firstName: 'Minh Thư' }]);
  });

  it('undo puts back the stored values', async () => {
    const { wrapper } = await openProfile();
    await nameInput(wrapper).setValue('Minh Thư');
    const undo = wrapper.findAll('button').find((button) => button.text() === 'Hoàn tác')!;
    await undo.trigger('click');
    expect(nameInput(wrapper).element.value).toBe('Thư');
    expect(wrapper.text()).toContain('Không có thay đổi chưa lưu.');
  });

  it('shows the saved about text as the server rendered it, and switches tabs with the arrow keys', async () => {
    const { wrapper } = await openProfile({}, 'Học sinh lớp 11');
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect(tabs[1]!.attributes('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]!.element);
    expect(wrapper.get('[role="tabpanel"]:not([style*="none"]) .user-content').html()).toContain(
      '<p>Học sinh lớp 11</p>',
    );
  });

  it('saves a new organization order as the full id list', async () => {
    const first = profileOrganization();
    const second = profileOrganization({ id: 'org-hcm', name: 'Đội tuyển Tin học TP.HCM' });
    const calls = mockApi({
      ...settingsRoutes({}, { organizations: [first, second] }),
      'PATCH /profile': ({ body }) => {
        const ids = (body as { organizations: string[] }).organizations;
        return ok(
          profile({
            organizations: ids.map((id) =>
              [first, second].find((organization) => organization.id === id)!,
            ),
          }),
        );
      },
    });
    const { wrapper } = await mountApp('/settings');
    await wrapper.get('button[aria-label="Chuyển Đội tuyển Tin học TP.HCM lên"]').trigger('click');
    await wrapper.get('button[type="submit"]').trigger('submit');
    await flushPromises();
    expect(patches(calls)).toEqual([{ organizations: ['org-hcm', first.id] }]);
  });

  it('shows the organizations sentence under the list when the server refuses it', async () => {
    mockApi({
      ...settingsRoutes({}, { organizations: [profileOrganization()] }),
      'PATCH /profile': invalid(
        issue(
          'organizations',
          'organizations_not_editable',
          'Organizations can only be reordered or shortened.',
        ),
      ),
    });
    const { wrapper } = await mountApp('/settings');
    await wrapper
      .get('button[aria-label="Rời THPT Chuyên Lê Hồng Phong khỏi danh sách"]')
      .trigger('click');
    await wrapper.get('button[type="submit"]').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Chỉ sắp xếp hoặc rời các tổ chức bạn đang tham gia.');
    expect(wrapper.text()).not.toContain('can only be reordered');
  });

  it('lists each invalid field as a link to its control, and the link moves the focus there', async () => {
    const { wrapper } = await openProfile();
    await nameInput(wrapper).setValue('Trần Minh Thư (lớp 11A1, chuyên Tin)');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    const link = wrapper.get('#main [role="alert"] a[href="#profile-firstName"]');
    expect(document.getElementById('profile-firstName')).toBe(nameInput(wrapper).element);
    await link.trigger('click');
    expect(document.activeElement).toBe(nameInput(wrapper).element);
  });

  it('counts a decomposed name as composed and sends the composed form', async () => {
    const { wrapper, calls } = await openProfile();
    const decomposed = 'Việt'.normalize('NFD');
    await nameInput(wrapper).setValue(decomposed);
    expect(wrapper.text()).toContain('4 / 30');
    await nameInput(wrapper).setValue('ệ'.normalize('NFD').repeat(30));
    expect(wrapper.text()).toContain('30 / 30');
    expect(wrapper.text()).not.toContain('Tên hiển thị tối đa');
    await nameInput(wrapper).setValue(decomposed);
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(patches(calls)).toEqual([{ firstName: 'Việt'.normalize('NFC') }]);
  });

  it('after a conflict the message names both causes, the name stays, and the retry drops the organization the server no longer lists', async () => {
    const first = profileOrganization();
    const second = profileOrganization({ id: 'org-hcm', name: 'Đội tuyển Tin học TP.HCM' });
    const calls = mockApi({
      ...settingsRoutes({}, { firstName: 'Thư', organizations: [first, second] }),
      'GET /profile': sequence(
        ok(profile({ firstName: 'Thư', organizations: [first, second] })),
        ok(profile({ firstName: 'Thư', organizations: [first] })),
      ),
      'PATCH /profile': sequence(
        fail(409, 'conflict'),
        ok(profile({ firstName: 'Minh Thư', organizations: [first] })),
      ),
    });
    const { wrapper } = await mountApp('/settings');
    await nameInput(wrapper).setValue('Minh Thư');
    await wrapper.get('button[aria-label="Chuyển Đội tuyển Tin học TP.HCM lên"]').trigger('click');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(patches(calls)[0]).toEqual({
      firstName: 'Minh Thư',
      organizations: [second.id, first.id],
    });
    expect(alertText(wrapper)).toContain('quản trị viên');
    expect(alertText(wrapper)).toContain('vừa thay đổi');
    expect(alertText(wrapper)).toContain('kể cả tổ chức bạn vừa bỏ');
    expect(alertText(wrapper)).not.toContain('lựa chọn của bạn');
    expect(wrapper.findAll('li strong').map((name) => name.text())).toEqual([first.name]);
    expect(nameInput(wrapper).element.value).toBe('Minh Thư');
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ firstName: 'Minh Thư' });
  });

  it('a removal the server still lists comes back after the conflict, with the message saying so', async () => {
    const first = profileOrganization();
    const second = profileOrganization({ id: 'org-hcm', name: 'Đội tuyển Tin học TP.HCM' });
    mockApi({
      ...settingsRoutes({}, { organizations: [first, second] }),
      'PATCH /profile': fail(409, 'conflict'),
    });
    const { wrapper } = await mountApp('/settings');
    await wrapper
      .get('button[aria-label="Rời THPT Chuyên Lê Hồng Phong khỏi danh sách"]')
      .trigger('click');
    expect(wrapper.findAll('li strong').map((name) => name.text())).toEqual([second.name]);
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    // The returned organization is appended after the viewer's own order, as the rebase rule says.
    expect(wrapper.findAll('li strong').map((name) => name.text())).toEqual([
      second.name,
      first.name,
    ]);
    expect(alertText(wrapper)).toContain('kể cả tổ chức bạn vừa bỏ');
  });

  it('the summary link to the about text switches to the write tab, then focuses the text', async () => {
    const { wrapper } = await openProfile();
    await wrapper.get('textarea').setValue('x'.repeat(65_537));
    await saveButton(wrapper).trigger('submit');
    await flushPromises();
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click');
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Bản đã lưu');
    await wrapper.get('#main [role="alert"] a[href="#profile-about"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Soạn thảo');
    expect(document.activeElement).toBe(wrapper.get('textarea').element);
  });
});
