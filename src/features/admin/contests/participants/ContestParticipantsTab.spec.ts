import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, participation } from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

/** The row's editor actions sit in its detail row, opened by the "Quản lý" disclosure. */
async function openManage(wrapper: {
  findAll: (
    selector: string,
  ) => { text: () => string; trigger: (event: string) => Promise<unknown> }[];
}) {
  await wrapper
    .findAll('button')
    .find((button) => button.text().startsWith('Quản lý'))!
    .trigger('click');
  await flushPromises();
}

describe('ContestParticipantsTab', () => {
  afterEach(() => vi.useRealTimers());

  it('lists participations and disqualifies one only after confirming', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...contestEditorRoutes(),
      'GET /contests/hcmus-w41/participations': page([participation()], {
        pageSize: 50,
        total: 214,
      }),
      // The backend answers a summary (no user, no score), so the page refetches the list.
      'POST /contests/hcmus-w41/participations/p-1/disqualify': ok({
        id: 'p-1',
        virtual: 0,
        isRegistered: true,
        isDisqualified: true,
        realStart: '2026-10-08T06:00:00.000Z',
        endTime: '2026-10-08T10:00:00.000Z',
      }),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/participants',
      '214 lượt tham gia · 50 mỗi trang',
    );
    expect(wrapper.text()).toContain('214 lượt tham gia · 50 mỗi trang');
    expect(wrapper.get('tbody tr').text()).toContain('Trực tiếp');
    await openManage(wrapper);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Loại khỏi bảng')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/disqualify'))).toBe(false);
    await confirmDialog('Loại khỏi bảng');
    expect(calls.find((call) => call.path.endsWith('/disqualify'))?.body).toEqual({
      disqualified: true,
    });
    expect(
      calls.filter((call) => call.method === 'GET' && call.path.endsWith('/participations')),
    ).toHaveLength(2);
  });

  const disqualifyRoutes = () => ({
    ...staffViewer(['judge.edit_own_contest']),
    ...contestEditorRoutes(),
    'GET /contests/hcmus-w41/participations': page([participation()], { pageSize: 50, total: 214 }),
    'POST /contests/hcmus-w41/participations/p-1/disqualify': ok({
      id: 'p-1',
      virtual: 0,
      isRegistered: true,
      isDisqualified: true,
      realStart: '2026-10-08T06:00:00.000Z',
      endTime: '2026-10-08T10:00:00.000Z',
    }),
  });
  const COUNT_LINE = '214 lượt tham gia · 50 mỗi trang';
  const disqualifyButton = (wrapper: {
    findAll: (
      selector: string,
    ) => { text: () => string; trigger: (event: string) => Promise<unknown> }[];
  }) => wrapper.findAll('button').find((button) => button.text() === 'Loại khỏi bảng')!;

  it('refetches the contest settings and marks the ranking stale after a disqualify, so a later General save cannot un-ban the user', async () => {
    const calls = mockApi(disqualifyRoutes());
    const { wrapper, queryClient } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/participants',
      COUNT_LINE,
    );
    const contestReads = () =>
      calls.filter((call) => call.method === 'GET' && call.path === '/contests/hcmus-w41').length;
    const before = contestReads();
    const ranking = [['contests', 'ranking', 'probe', 'hcmus-w41']];
    seedCache(queryClient, ranking);
    await openManage(wrapper);
    await disqualifyButton(wrapper).trigger('click');
    await confirmDialog('Loại khỏi bảng');
    await flushPromises();
    expect(contestReads()).toBeGreaterThan(before);
    expect(invalidatedKeys(queryClient, ranking)).toHaveLength(1);
  });

  it('disqualifies the ticked rows in one call and reports the refused ones by username', async () => {
    const calls = mockApi({
      ...disqualifyRoutes(),
      'POST /contests/hcmus-w41/participations/disqualify': ok({
        results: [{ id: 'p-1', outcome: 'failed', reason: 'not_found' }],
        done: 0,
        failed: 1,
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/participants', COUNT_LINE);
    await wrapper.get('tbody input[type="checkbox"]').setValue(true);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Loại các dòng đã chọn')!
      .trigger('click');
    await confirmDialog('Loại các dòng đã chọn');
    await flushPromises();
    expect(calls.find((call) => call.path.endsWith('/participations/disqualify'))?.body).toEqual({
      ids: ['p-1'],
      disqualified: true,
    });
    expect(wrapper.text()).toContain('Đã đổi 0');
    expect(wrapper.text()).toContain(participation().user.username);
  });
});
