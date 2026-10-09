import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { invalid, issue, mockApi, ok } from '@/test/mock-api';
import { staffViewer, switchNamed } from '@/test/admin-routes';
import {
  contestEditorRoutes,
  contestSettings,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '../contest-spec-helpers';

const EDIT = ['judge.edit_own_contest'];
const save = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Lưu thay đổi')!
    .trigger('click');
  await flushPromises();
};

describe('ContestGeneralTab', () => {
  it('clears the time limit as null and sends nothing else', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(editableContest({ timeLimit: 3600 })),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    await wrapper.get('#contest-timeLimit').setValue('');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ timeLimit: null });
  });

  it('switches the format, shows that format’s fields and sends its default config', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    expect(wrapper.find('#contest-format-penalty').exists()).toBe(true);
    await wrapper.get('#contest-formatName').setValue('vnoj');
    expect(wrapper.text()).toContain('Chỉ tính lần nộp cuối');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      formatName: 'vnoj',
      formatConfig: { penalty: 5, lso: false },
    });
  });

  it('shows the stored announcements switch as it is and sends it only when flipped', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(
        editableContest({ settings: contestSettings({ pushAnnouncements: true }) }),
      ),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    expect(switchNamed(wrapper, 'Gửi cả qua kênh trực tiếp').attributes('aria-checked')).toBe(
      'true',
    );
    await save(wrapper);
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await switchNamed(wrapper, 'Gửi cả qua kênh trực tiếp').trigger('click');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      pushAnnouncements: false,
    });
  });

  it('says whether a ranking access code is set, keeps it when the box is blank, and removes it only when asked', async () => {
    const calls = mockApi({
      ...staffViewer([...EDIT, 'judge.contest_access_code']),
      ...contestEditorRoutes(
        editableContest({ settings: contestSettings({ hasRankingAccessCode: true }) }),
      ),
      'PATCH /contests/hcmus-w41': ok(
        editableContest({ settings: contestSettings({ hasRankingAccessCode: true }) }),
      ),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    expect(wrapper.get('#contest-rankingAccessCode-hint').text()).toContain('Đã đặt mã');
    await wrapper.get('#contest-name').setValue('Tuần 41');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ name: 'Tuần 41' });
    await wrapper.get('#contest-removeRankingAccessCode').setValue(true);
    await save(wrapper);
    expect(calls.filter((call) => call.method === 'PATCH').at(-1)?.body).toEqual({
      rankingAccessCode: '',
    });
  });

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

  it('names the settings user lists from the usernames the API sends, and keeps them when saving other fields', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Thông tin kỳ thi',
    );
    expect(wrapper.get('[data-testid="contest-curators"]').text()).toContain('admin_vnoj');
    await wrapper.get('#contest-name').setValue('Tuần 41');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ name: 'Tuần 41' });
  });

  it('creates a contest and opens its editor', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.add_contest']),
      'POST /contests': ok(editableContest({ key: 'w42' })),
      'GET /contests/w42': ok(editableContest({ key: 'w42' })),
    });
    const { wrapper, router } = await mountAndWaitFor('/admin/contests/new', 'Tạo kỳ thi');
    await wrapper.get('#contest-key').setValue('w42');
    await wrapper.get('#contest-name').setValue('W42');
    await wrapper.get('#contest-startTime').setValue('2026-10-15T13:00');
    await wrapper.get('#contest-endTime').setValue('2026-10-15T17:00');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo kỳ thi')!
      .trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.method === 'POST')?.body;
    expect(body).toMatchObject({ key: 'w42', name: 'W42' });
    // The account holds only judge.add_contest: no rating, lock, private, access-code or visibility field may travel with the create.
    for (const field of [
      'rateAll',
      'isRated',
      'ratingFloor',
      'lockedAfter',
      'isPrivate',
      'accessCode',
      'isVisible',
    ])
      expect(body, field).not.toHaveProperty(field);
    expect(router.currentRoute.value.fullPath).toBe('/admin/contests/w42/general');
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
});
