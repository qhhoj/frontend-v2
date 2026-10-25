import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { fail, invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer } from '@/test/admin-routes';
import { organizationItem, profile, sessionUser, signedIn } from '@/test/fixtures';
import {
  contestEditorRoutes,
  contestSettings,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { needsPermissionText } from '../../ui/permission-text';

const EDIT = ['judge.edit_own_contest'];
/** A heading only the Basic view has. */
const BASIC_MARK = 'Cách tính điểm';
const STALE_AFTER_WRITE = [
  ['contests', 'list', 'probe'],
  ['admin', 'index', 'contests', 'probe'],
];
const SWITCH = '[data-testid="contest-visibility"] [role="switch"]';
const save = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Lưu')!
    .trigger('click');
  await flushPromises();
};

describe('ContestGeneralTab', () => {
  it('locks visibility, privacy, the access code, locking and rating behind their permissions', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    for (const permission of [
      'judge.create_private_contest',
      'judge.contest_access_code',
      'judge.lock_contest',
      'judge.contest_rating',
    ])
      expect(wrapper.text(), permission).toContain(needsPermissionText(permission));
    expect(wrapper.text()).not.toContain('judge.');
    expect(wrapper.get('#contest-accessCode').attributes('disabled')).toBeDefined();
    await router.push('/admin/contests/hcmus-w41/general');
    await flushPromises();
    expect(wrapper.text()).toContain(needsPermissionText('judge.change_contest_visibility'));
  });

  it('shows a server field error next to its own field', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': invalid(issue('endTime', 'is_timestamp', 'bad')),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/general', BASIC_MARK);
    await wrapper.get('#contest-name').setValue('Tuần 41');
    await save(wrapper);
    expect(wrapper.get('#contest-endTime').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Thời điểm không hợp lệ.');
  });

  it('marks the public contest pages and the admin index stale after a save and after a create', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(editableContest({ timeLimit: 3600 })),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const saved = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    seedCache(saved.queryClient, STALE_AFTER_WRITE);
    await saved.wrapper.get('#contest-timeLimit').setValue('');
    await save(saved.wrapper);
    expect(invalidatedKeys(saved.queryClient, STALE_AFTER_WRITE)).toEqual(STALE_AFTER_WRITE);
    saved.wrapper.unmount();

    mockApi({
      ...staffViewer(['judge.add_contest']),
      'POST /contests': ok(editableContest({ key: 'w42' })),
      'GET /contests/w42': ok(editableContest({ key: 'w42' })),
    });
    const created = await mountAndWaitFor('/admin/contests/new', 'Tạo kỳ thi');
    seedCache(created.queryClient, STALE_AFTER_WRITE);
    await created.wrapper.get('#contest-key').setValue('w42');
    await created.wrapper.get('#contest-name').setValue('W42');
    await created.wrapper.get('#contest-startTime').setValue('15/10/2026 13:00');
    await created.wrapper.get('#contest-endTime').setValue('15/10/2026 17:00');
    await created.wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo kỳ thi')!
      .trigger('click');
    await flushPromises();
    expect(invalidatedKeys(created.queryClient, STALE_AFTER_WRITE)).toEqual(STALE_AFTER_WRITE);
    expect(created.router.currentRoute.value.fullPath).toBe('/admin/contests/w42/problems');
  });

  it('shows the refusal for a tag that is not in the catalogue', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': fail(400, 'unknown_tag', undefined, [
        issue('tags', 'unknown_tag', 'Unknown tag moi.'),
      ]),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    await wrapper.get('#contest-rules').setValue('x');
    await save(wrapper);
    expect(wrapper.text()).toContain('Có thẻ chưa có trong danh mục thẻ kỳ thi.');
    expect(wrapper.text()).toContain('Thẻ này chưa có trong danh mục thẻ kỳ thi.');
    expect(wrapper.text()).not.toContain('Unknown tag moi.');
  });

  describe('visibility for an organization admin holding only create_private_contest', () => {
    const orgAdmin = () => ({
      'GET /auth/me': signedIn({
        user: sessionUser({
          isStaff: false,
          permissions: [...EDIT, 'judge.create_private_contest'],
        }),
      }),
      'GET /profile': ok(profile()),
    });
    const openVisibility = async (contest: ReturnType<typeof editableContest>) => {
      mockApi({ ...orgAdmin(), ...contestEditorRoutes(contest) });
      const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/general', BASIC_MARK);
      return wrapper.get(SWITCH);
    };

    it('can toggle it on an organization-private contest', async () => {
      const toggle = await openVisibility(
        editableContest({
          isOrganizationPrivate: true,
          settings: contestSettings({ isVisible: false, isOrganizationPrivate: true }),
        }),
      );
      expect(toggle.attributes('aria-disabled')).toBeUndefined();
    });

    it('cannot toggle it on a public contest', async () => {
      const toggle = await openVisibility(
        editableContest({ settings: contestSettings({ isVisible: false }) }),
      );
      expect(toggle.attributes('aria-disabled')).toBe('true');
    });
  });

  it('keeps visibility open for staff with change_contest_visibility on a public contest', async () => {
    mockApi({
      ...staffViewer([...EDIT, 'judge.change_contest_visibility']),
      ...contestEditorRoutes(editableContest({ settings: contestSettings({ isVisible: false }) })),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/general', BASIC_MARK);
    expect(wrapper.get(SWITCH).attributes('aria-disabled')).toBeUndefined();
  });

  it('shows a hidden contest at once from the summary switch, with the state in words', async () => {
    const hidden = editableContest({ settings: contestSettings({ isVisible: false }) });
    const calls = mockApi({
      ...staffViewer([...EDIT, 'judge.change_contest_visibility']),
      ...contestEditorRoutes(hidden),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/general', BASIC_MARK);
    const summary = () => wrapper.get('[data-testid="contest-visibility"]');
    expect(summary().text()).toContain('Ẩn — thí sinh chưa thấy');
    await wrapper.get(SWITCH).trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')!.body).toEqual({ isVisible: true });
    expect(wrapper.get(SWITCH).attributes('aria-checked')).toBe('true');
    expect(summary().text()).toContain('Đang hiện');
    expect(wrapper.text()).not.toContain('thay đổi chưa lưu');
  });

  it('names an organization chip instead of showing its id', async () => {
    const orgId = '01a1a1a1-0000-7000-8000-000000007285';
    mockApi({
      ...staffViewer([...EDIT, 'judge.create_private_contest']),
      ...contestEditorRoutes(
        editableContest({
          isOrganizationPrivate: true,
          settings: contestSettings({ isOrganizationPrivate: true, organizations: [orgId] }),
        }),
      ),
      'GET /organizations': page([organizationItem({ id: orgId, name: 'THPT Hùng Vương' })]),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    await flushPromises();
    const chip = wrapper.get('[data-testid="organization-chip"]');
    expect(chip.text()).toContain('THPT Hùng Vương');
    expect(chip.text()).not.toContain('01a1');
  });

  it('keeps the view in the URL: the Advanced tab shows the other fields and the link reopens them', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      BASIC_MARK,
    );
    expect(wrapper.find('#contest-rules').exists()).toBe(false);
    await wrapper.get('[data-testid="editor-view-advanced"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.view).toBe('advanced');
    expect(wrapper.find('#contest-rules').exists()).toBe(true);
    expect(wrapper.find('#contest-name').exists()).toBe(false);
    wrapper.unmount();

    const reopened = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    expect(reopened.wrapper.find('#contest-rules').exists()).toBe(true);
  });

  it('keeps an edit made in one view when the other view is shown, and saves both with one PATCH', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      BASIC_MARK,
    );
    await wrapper.get('#contest-name').setValue('Tuần 41');
    await router.push('/admin/contests/hcmus-w41/general?view=advanced');
    await flushPromises();
    await wrapper.get('#contest-rules').setValue('Không dùng tài liệu.');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toMatchObject({
      name: 'Tuần 41',
      rules: 'Không dùng tài liệu.',
    });
  });

  it('brings the Advanced view up, flagged, when a save is refused for one of its fields', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': invalid(issue('frozenLastMinutes', 'min', 'too small')),
    });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      BASIC_MARK,
    );
    await wrapper.get('#contest-name').setValue('Tuần 41');
    await save(wrapper);
    expect(router.currentRoute.value.query.view).toBe('advanced');
    expect(wrapper.get('#contest-frozenLastMinutes').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('[data-testid="editor-view-advanced-alert"]').exists()).toBe(true);
  });

  it('creates from key, name and time only, and sends nothing while the start and end are missing', async () => {
    const calls = mockApi({ ...staffViewer(['judge.add_contest']) });
    const { wrapper } = await mountAndWaitFor('/admin/contests/new', 'Tạo kỳ thi');
    expect(wrapper.find('[data-testid="editor-view-advanced"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain(BASIC_MARK);
    await wrapper.get('#contest-key').setValue('w42');
    await wrapper.get('#contest-name').setValue('W42');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo kỳ thi')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('#contest-startTime').attributes('aria-invalid')).toBe('true');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('counts an unsaved Advanced edit on the Advanced tab', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general?view=advanced',
      'Thông tin kỳ thi',
    );
    const count = () => Number(wrapper.get('[data-testid="editor-view-advanced-count"]').text());
    const before = count();
    await wrapper.get('#contest-rules').setValue('Không dùng tài liệu.');
    expect(count()).toBe(before + 1);
  });

  it('refuses a number box holding unreadable text instead of saving it as a clear', async () => {
    const contest = editableContest({ timeLimit: 3600 });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(contest),
      [`PATCH /contests/${contest.key}`]: ok(contest),
    });
    const { wrapper } = await mountAndWaitFor(
      `/admin/contests/${contest.key}/general?view=advanced`,
      'Thông tin kỳ thi',
    );
    // jsdom never reports badInput; a browser does for text it cannot parse, and then also reads the value as ''.
    const box = wrapper.get('#contest-timeLimit').element as HTMLInputElement;
    Object.defineProperty(box, 'validity', { value: { badInput: true }, configurable: true });
    await wrapper.get('#contest-timeLimit').setValue('');
    await save(wrapper);
    Object.defineProperty(box, 'validity', { value: { badInput: false }, configurable: true });
    expect(wrapper.text()).toContain('Giá trị không phải là số.');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);

    await wrapper.get('#contest-timeLimit').setValue('');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ timeLimit: null });
  });
});
