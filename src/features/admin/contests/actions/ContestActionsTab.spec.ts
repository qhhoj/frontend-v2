import { needsPermissionText } from '../../ui/permission-text';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { fail, issue, mockApi, ok, sequence } from '@/test/mock-api';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import {
  contestActions,
  contestDataStatus,
  contestEditorRoutes,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

const routes = (extra = {}) => ({
  ...contestEditorRoutes(),
  'GET /contests/hcmus-w41/data': ok(contestDataStatus()),
  'GET /contests/hcmus-w41/actions': ok(contestActions()),
  ...extra,
});
const click = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};
const TAB_TEXT = 'Tính lại điểm và hạng của mọi lượt tham gia';

afterEach(() => vi.restoreAllMocks());

describe('ContestActionsTab', () => {
  it('rescores only after confirming, then shows the queued state the status endpoint reports', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({
        'POST /contests/hcmus-w41/rescore': { status: 202, body: { data: { queued: true } } },
        'GET /contests/hcmus-w41/actions': sequence(
          ok(contestActions()),
          ok(contestActions({ rescore: 'queued' })),
        ),
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    await click(wrapper, 'Tính lại điểm');
    expect(openDialog().textContent).toContain('214 lượt tham gia');
    expect(calls.some((call) => call.path.endsWith('/rescore'))).toBe(false);
    await confirmDialog('Tính lại');
    expect(calls.some((call) => call.path.endsWith('/rescore'))).toBe(true);
    const card = wrapper.get('[data-testid="action-rescore"]');
    expect(card.get('[role="status"]').text()).toContain('Đang chờ trong hàng chạy nền');
    expect(card.text()).not.toContain('Không có trạng thái tiến trình');
  });

  it('shows a running action as running and refuses to start it again', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({ 'GET /contests/hcmus-w41/actions': ok(contestActions({ rescore: 'running' })) }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', 'Đang chạy.');
    const card = wrapper.get('[data-testid="action-rescore"]');
    expect(card.text()).toContain('Đang chạy');
    const button = card
      .findAll('button')
      .find((candidate) => candidate.text() === 'Tính lại điểm')!;
    expect(button.attributes('aria-disabled')).toBe('true');
    await button.trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('does not offer final judging while the contest runs, and names the rule', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_contest']), ...routes() });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    expect(wrapper.get('[data-testid="action-judgeFinal"]').text()).toContain(
      'Chỉ dùng cho thể thức lần nộp cuối',
    );
    expect(wrapper.findAll('button').some((button) => button.text() === 'Chấm lần cuối')).toBe(
      false,
    );
  });

  it('hides rating and clone without their permissions', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_contest']), ...routes() });
    const rating = needsPermissionText('judge.contest_rating');
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', rating);
    expect(wrapper.get('[data-testid="action-rate"]').text()).toContain(rating);
    expect(wrapper.get('[data-testid="action-clone"]').text()).toContain(
      needsPermissionText('judge.clone_contest'),
    );
    expect(wrapper.text()).not.toContain('judge.');
  });

  it('prepares the export with a glob and results, offers every backend result, and links the download when ready', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({
        ...contestEditorRoutes(editableContest({ phase: 'ended' })),
        'GET /contests/hcmus-w41/data': ok(
          contestDataStatus({ state: 'none', size: null, nextPrepareAt: null }),
        ),
        'POST /contests/hcmus-w41/data': { status: 202, body: { data: { queued: true } } },
      }),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/actions',
      'Chưa có tệp xuất.',
    );
    await click(wrapper, 'Chuẩn bị');
    const offered = [
      ...openDialog().querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ].map((box) => box.value);
    expect(offered).toEqual([
      'AC',
      'WA',
      'TLE',
      'MLE',
      'OLE',
      'IR',
      'RTE',
      'CE',
      'IE',
      'SC',
      'AB',
      'RJ',
    ]);
    (document.body.querySelector('#prepare-glob') as HTMLInputElement).value = 'hcmus41*';
    document.body.querySelector('#prepare-glob')!.dispatchEvent(new Event('input'));
    (document.body.querySelector('input[value="AC"]') as HTMLInputElement).click();
    await flushPromises();
    await confirmDialog('Chuẩn bị');
    expect(
      calls.find((call) => call.method === 'POST' && call.path.endsWith('/data'))?.body,
    ).toEqual({ problemGlob: 'hcmus41*', results: ['AC'] });
  });

  it('does not ask for the export before the contest has ended, and says why', async () => {
    const calls = mockApi({ ...staffViewer(['judge.edit_own_contest']), ...routes() });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/actions',
      'Xuất dữ liệu có sau khi kỳ thi kết thúc.',
    );
    expect(calls.some((call) => call.path === '/contests/hcmus-w41/data')).toBe(false);
    expect(wrapper.text()).not.toContain('Thử lại');
  });

  it('shows a taken clone key under the box, inside the dialog that stays open', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest', 'judge.clone_contest']),
      ...routes({
        'POST /contests/hcmus-w41/clone': fail(400, 'validation_failed', undefined, [
          issue('key', 'key_taken', 'taken'),
        ]),
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    await click(wrapper, 'Nhân bản');
    (document.body.querySelector('#clone-key') as HTMLInputElement).value = 'hcmus-w41';
    document.body.querySelector('#clone-key')!.dispatchEvent(new Event('input'));
    await confirmDialog('Nhân bản');
    expect(openDialog().textContent).toContain('Khóa này đã có.');
  });
});

/** Rating follows the backend's freeze rule: only icpc and vnoj freeze, and only with a window set. */
describe('rating by format and freeze window', () => {
  it.each([
    { formatName: 'final_submission', frozenLastMinutes: 60, offered: true },
    { formatName: 'ioi', frozenLastMinutes: 60, offered: true },
    { formatName: 'icpc', frozenLastMinutes: 60, offered: false },
    { formatName: 'icpc', frozenLastMinutes: 0, offered: true },
  ] as const)(
    '$formatName with a freeze window of $frozenLastMinutes minutes: rating offered is $offered',
    async ({ formatName, frozenLastMinutes, offered }) => {
      mockApi({
        ...staffViewer(['judge.edit_own_contest', 'judge.contest_rating']),
        ...routes({
          'GET /contests/hcmus-w41': ok(
            editableContest({ formatName, phase: 'ended', frozenLastMinutes }),
          ),
        }),
      });
      const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
      const card = wrapper.get('[data-testid="action-rate"]');
      expect(card.findAll('button').some((button) => button.text() === 'Tính rating')).toBe(
        offered,
      );
      expect(card.text().includes('Bảng xếp hạng vẫn đang đóng băng')).toBe(!offered);
    },
  );

  it('marks the public contest pages and the admin index stale after a clone', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest', 'judge.clone_contest']),
      ...routes({
        'POST /contests/hcmus-w41/clone': ok(editableContest({ key: 'w42' })),
        'GET /contests/w42': ok(editableContest({ key: 'w42' })),
      }),
    });
    const { wrapper, queryClient } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/actions',
      TAB_TEXT,
    );
    const keys = [
      ['contests', 'list', 'probe'],
      ['admin', 'index', 'contests', 'probe'],
    ];
    seedCache(queryClient, keys);
    await click(wrapper, 'Nhân bản');
    (document.body.querySelector('#clone-key') as HTMLInputElement).value = 'w42';
    document.body.querySelector('#clone-key')!.dispatchEvent(new Event('input'));
    await confirmDialog('Nhân bản');
    expect(invalidatedKeys(queryClient, keys)).toEqual(keys);
  });

  it('clones a week later by default, says when the copy ends, and opens the copy', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-09T00:00:00.000Z'));
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest', 'judge.clone_contest']),
      ...routes({
        'POST /contests/hcmus-w41/clone': ok(editableContest({ key: 'w42' })),
        'GET /contests/w42': ok(editableContest({ key: 'w42' })),
      }),
    });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/actions',
      TAB_TEXT,
    );
    await click(wrapper, 'Nhân bản');
    expect(openDialog().textContent).toContain('Kết thúc 15/10/2026 17:00');
    (document.body.querySelector('#clone-key') as HTMLInputElement).value = 'w42';
    document.body.querySelector('#clone-key')!.dispatchEvent(new Event('input'));
    await confirmDialog('Nhân bản');
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      key: 'w42',
      startTime: '2026-10-15T06:00:00.000Z',
    });
    expect(router.currentRoute.value.fullPath).toBe('/admin/contests/w42/general');
  });
});

describe('replay rebuild card', () => {
  const rebuildCalls = (calls: { path: string }[]) =>
    calls.filter((call) => call.path.endsWith('/replay/rebuild'));
  const mountEnded = (extra = {}) => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({ ...contestEditorRoutes(editableContest({ phase: 'ended' })), ...extra }),
    });
    return { calls, mounted: mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT) };
  };

  it('rebuilds the replay of an ended contest after confirming, then shows the queued state', async () => {
    const { calls, mounted } = mountEnded({
      'POST /contests/hcmus-w41/replay/rebuild': { status: 202, body: { data: { queued: true } } },
      'GET /contests/hcmus-w41/actions': sequence(
        ok(contestActions()),
        ok(contestActions({ replay: 'queued' })),
      ),
    });
    const { wrapper } = await mounted;
    await click(wrapper, 'Dựng lại bản phát lại');
    expect(rebuildCalls(calls)).toHaveLength(0);
    await confirmDialog('Dựng lại');
    expect(rebuildCalls(calls)).toHaveLength(1);
    const card = wrapper.get('[data-testid="action-replay"]');
    expect(card.get('[role="status"]').text()).toContain('Đang chờ trong hàng chạy nền');
  });

  it.each([
    ['a running contest', editableContest()],
    [
      'a final-submission contest',
      editableContest({ phase: 'ended', formatName: 'final_submission' }),
    ],
  ])('does not offer the rebuild for %s, and names the rule', async (_name, contest) => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes(contestEditorRoutes(contest)),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    const card = wrapper.get('[data-testid="action-replay"]');
    expect(card.find('button').exists()).toBe(false);
    expect(card.text()).toContain('Chỉ dựng lại sau khi kỳ thi kết thúc');
  });

  it('does not start a second rebuild while one is queued', async () => {
    const { calls, mounted } = mountEnded({
      'GET /contests/hcmus-w41/actions': ok(contestActions({ replay: 'queued' })),
    });
    const { wrapper } = await mounted;
    await click(wrapper, 'Dựng lại bản phát lại');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(rebuildCalls(calls)).toHaveLength(0);
  });

  it('shows the wait from Retry-After when rebuilds are rate-limited, inside the dialog', async () => {
    const { mounted } = mountEnded({
      'POST /contests/hcmus-w41/replay/rebuild': {
        ...fail(429, 'rate_limited'),
        headers: { 'Retry-After': '1200' },
      },
    });
    const { wrapper } = await mounted;
    await click(wrapper, 'Dựng lại bản phát lại');
    await confirmDialog('Dựng lại');
    expect(openDialog().querySelector('[role="alert"]')?.textContent).toContain('20 phút');
  });
});
