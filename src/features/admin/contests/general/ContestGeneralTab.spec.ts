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
const STALE_AFTER_WRITE = [
  ['contests', 'list', 'probe'],
  ['admin', 'index', 'contests', 'probe'],
];
const save = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Lưu thay đổi')!
    .trigger('click');
  await flushPromises();
};

describe('ContestGeneralTab', () => {
  it('locks visibility, privacy, the access code, locking and rating behind their permissions', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    for (const permission of [
      'judge.change_contest_visibility',
      'judge.create_private_contest',
      'judge.contest_access_code',
      'judge.lock_contest',
      'judge.contest_rating',
    ])
      expect(wrapper.text(), permission).toContain(needsPermissionText(permission));
    expect(wrapper.text()).not.toContain('judge.');
    expect(wrapper.get('#contest-accessCode').attributes('disabled')).toBeDefined();
  });

  it('shows a server field error next to its own field', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': invalid(issue('endTime', 'is_timestamp', 'bad')),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
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
    const saved = await mountAndWaitFor('/admin/contests/hcmus-w41/general', 'Thông tin kỳ thi');
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
    expect(created.router.currentRoute.value.fullPath).toBe('/admin/contests/w42/general');
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
      '/admin/contests/hcmus-w41/general',
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
      const { wrapper } = await mountAndWaitFor(
        '/admin/contests/hcmus-w41/general',
        'Thông tin kỳ thi',
      );
      return wrapper.get('#contest-isVisible');
    };

    it('can toggle it on an organization-private contest', async () => {
      const checkbox = await openVisibility(
        editableContest({
          isOrganizationPrivate: true,
          settings: contestSettings({ isVisible: false, isOrganizationPrivate: true }),
        }),
      );
      expect(checkbox.attributes('disabled')).toBeUndefined();
    });

    it('cannot toggle it on a public contest', async () => {
      const checkbox = await openVisibility(
        editableContest({ settings: contestSettings({ isVisible: false }) }),
      );
      expect(checkbox.attributes('disabled')).toBeDefined();
    });
  });

  it('keeps visibility open for staff with change_contest_visibility on a public contest', async () => {
    mockApi({
      ...staffViewer([...EDIT, 'judge.change_contest_visibility']),
      ...contestEditorRoutes(editableContest({ settings: contestSettings({ isVisible: false }) })),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    expect(wrapper.get('#contest-isVisible').attributes('disabled')).toBeUndefined();
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
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    await flushPromises();
    const chip = wrapper.get('[data-testid="organization-chip"]');
    expect(chip.text()).toContain('THPT Hùng Vương');
    expect(chip.text()).not.toContain('01a1');
  });
});
