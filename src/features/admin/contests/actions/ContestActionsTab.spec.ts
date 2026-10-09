import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { mountApp } from '@/test/mount';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import {
  contestActions,
  contestDataStatus,
  contestEditorRoutes,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '../contest-spec-helpers';

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
const submitLabel = () => openDialog().querySelector('button[type="submit"]')?.textContent?.trim();
const TAB_TEXT = 'Tính lại điểm và hạng của mọi lượt tham gia';

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
    expect(card.find('[data-placement="queued"]').exists()).toBe(true);
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

  it('warns that final judging runs early while the contest is still on', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({
        'GET /contests/hcmus-w41': ok(
          editableContest({ endTime: new Date(Date.now() + 3_600_000).toISOString() }),
        ),
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    await click(wrapper, 'Chấm lần cuối');
    expect(openDialog().textContent).toContain('Kỳ thi chưa kết thúc');
    expect(submitLabel()).toBe('Vẫn chấm');
  });

  it('hides rating and clone without their permissions', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_contest']), ...routes() });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/actions',
      'Cần quyền judge.contest_rating',
    );
    expect(wrapper.get('[data-testid="action-rate"]').text()).toContain(
      'Cần quyền judge.contest_rating',
    );
    expect(wrapper.get('[data-testid="action-clone"]').text()).toContain(
      'Cần quyền judge.clone_contest',
    );
  });

  it('prepares the export with a glob and results, offers every backend result, and links the download when ready', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...routes({
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

  it('shows a taken clone key under the box, inside the dialog that stays open', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest', 'judge.clone_contest']),
      ...routes({
        'POST /contests/hcmus-w41/clone': fail(400, 'validation_failed', {
          key: ['That key is taken.'],
        }),
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/actions', TAB_TEXT);
    await click(wrapper, 'Nhân bản');
    (document.body.querySelector('#clone-key') as HTMLInputElement).value = 'hcmus-w41';
    document.body.querySelector('#clone-key')!.dispatchEvent(new Event('input'));
    await confirmDialog('Nhân bản');
    expect(openDialog().textContent).toContain('That key is taken.');
  });
});
