import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { fail, invalid, issue, mockApi, ok } from '@/test/mock-api';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

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
      expect(wrapper.text(), permission).toContain(`Cần quyền ${permission}`);
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
    await created.wrapper.get('#contest-startTime').setValue('2026-10-15T13:00');
    await created.wrapper.get('#contest-endTime').setValue('2026-10-15T17:00');
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
});
