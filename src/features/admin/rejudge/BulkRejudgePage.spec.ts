import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, rateLimited } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';

import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { problemMeta } from '@/test/fixtures';

const PERMS = ['judge.rejudge_submission'];
type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const isDryRun = (call: ApiCall) => (call.body as { dryRun?: boolean }).dryRun === true;
const posts = (calls: ApiCall[]) => calls.filter((call) => call.method === 'POST');
const counted = (count: number, allowed = true) => ok({ count, dryRun: true, allowed });
const queued = (count: number) => ok({ count, dryRun: false, allowed: true });
const submitButton = () => openDialog().querySelector<HTMLButtonElement>('button[type="submit"]')!;
const dialogText = () => openDialog().textContent ?? '';

/** Answers the dry run and the real request separately; either may be a plain answer or a function of the call. */
const answer = (dry: MockHandler, real: MockHandler) => (call: ApiCall) => {
  const handler = isDryRun(call) ? dry : real;
  return typeof handler === 'function' ? handler(call) : handler;
};
const routes = (post: MockHandler) => ({
  ...staffViewer(PERMS),
  'GET /problems/meta': ok(problemMeta()),
  'POST /submissions/rejudge': post,
});
/** The screen is a lazy route: the form is there once its chunk has loaded. */
const mountRejudge = async () => {
  const mounted = await mountApp('/admin/rejudge');
  await vi.waitFor(() => expect(mounted.wrapper.find('#rejudge-problem').exists()).toBe(true));
  return mounted;
};
const clickRejudge = async (wrapper: Wrapper) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Chấm lại các bài nộp này')!
    .trigger('click');
  await flushPromises();
};
const openConfirm = async (wrapper: Wrapper) => {
  await wrapper.get('#rejudge-problem').setValue('hcmus41c');
  await wrapper.get('input[value="WA"]').setValue(true);
  await clickRejudge(wrapper);
};

describe('BulkRejudgePage', () => {
  it('counts with a dry run when the confirm opens, resets nothing, then queues after the confirm', async () => {
    const calls = mockApi(routes(answer(counted(128), queued(128))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(posts(calls).map((call) => call.body)).toEqual([
      { problem: 'hcmus41c', results: ['WA'], dryRun: true },
    ]);
    expect(dialogText()).toContain('128');
    expect(dialogText()).toContain('Được phép chạy');
    expect(submitButton().getAttribute('aria-disabled')).toBeNull();

    await confirmDialog('Chấm lại 128 bài nộp');
    expect(posts(calls)[1]?.body).toEqual({ problem: 'hcmus41c', results: ['WA'] });
    expect(wrapper.get('[role="status"]').text()).toContain('Đã xếp lại 128 bài nộp.');
    expect(wrapper.find('[data-placement="done"]').exists()).toBe(true);
  });

  it('offers every result the backend accepts', async () => {
    mockApi(routes(queued(0)));
    const { wrapper } = await mountRejudge();
    const offered = wrapper
      .findAll('input[type="checkbox"][name="rejudge-result"]')
      .map((box) => box.attributes('value'));
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
  });

  it('shows the count over the limit with the permission it needs, and the confirm cannot send', async () => {
    const calls = mockApi(routes(answer(counted(1340, false), fail(403, 'forbidden'))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(dialogText()).toContain('1.340');
    expect(dialogText()).toContain('Cần quyền riêng');
    expect(dialogText()).toContain('judge.rejudge_submission_lot');
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    expect(submitButton().textContent?.trim()).toBe('Chấm lại');

    await confirmDialog('Chấm lại');
    expect(posts(calls)).toHaveLength(1);
  });

  it('does not offer a rejudge of zero submissions', async () => {
    const calls = mockApi(routes(answer(counted(0), queued(0))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(dialogText()).toContain('Không có bài nộp nào khớp bộ lọc.');
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    await confirmDialog('Chấm lại');
    expect(posts(calls)).toHaveLength(1);
  });

  it('words a refused count inside the dialog, keeps the confirm shut and claims no count', async () => {
    const calls = mockApi(routes(answer(fail(403, 'forbidden'), queued(1))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(openDialog().querySelector('[role="alert"]')?.textContent).toContain(
      'Bạn không có quyền làm việc này.',
    );
    expect(dialogText()).not.toContain('judge.rejudge_submission_lot');
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    await confirmDialog('Chấm lại');
    expect(posts(calls)).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Đã xếp lại');
  });

  it('words a rate limited count as a wait', async () => {
    mockApi(routes(answer(rateLimited(30), queued(1))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(dialogText()).toContain('Thử lại sau 30 giây.');
    expect(submitButton().getAttribute('aria-disabled')).toBe('true');
  });

  it('counts again each time the confirm opens, never showing the old count', async () => {
    let asked = 0;
    const calls = mockApi(
      routes(answer(() => (++asked === 1 ? counted(5) : counted(6)), queued(6))),
    );
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(submitButton().textContent?.trim()).toBe('Chấm lại 5 bài nộp');
    await cancelDialog();
    await clickRejudge(wrapper);
    expect(submitButton().textContent?.trim()).toBe('Chấm lại 6 bài nộp');
    expect(posts(calls).filter(isDryRun)).toHaveLength(2);
  });

  it('words a 403 on the real request as a plain refusal and keeps the filter', async () => {
    const calls = mockApi(routes(answer(counted(3), fail(403, 'forbidden'))));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    await confirmDialog('Chấm lại 3 bài nộp');
    expect(wrapper.get('[role="alert"]').text()).toContain('Bạn không có quyền làm việc này.');
    expect(wrapper.text()).not.toContain('judge.rejudge_submission_lot');
    expect(posts(calls)).toHaveLength(2);
    expect((wrapper.get('#rejudge-problem').element as HTMLInputElement).value).toBe('hcmus41c');
  });

  it('sends nothing without a problem code', async () => {
    const calls = mockApi({ ...staffViewer(PERMS), 'GET /problems/meta': ok(problemMeta()) });
    const { wrapper } = await mountRejudge();
    await clickRejudge(wrapper);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.get('#rejudge-problem').attributes('aria-invalid')).toBe('true');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('marks the submission lists stale after queueing a rejudge', async () => {
    mockApi(routes(answer(counted(3), queued(3))));
    const { wrapper, queryClient } = await mountRejudge();
    const lists = [['submissions', 'list', 'probe']];
    seedCache(queryClient, lists);
    await openConfirm(wrapper);
    await confirmDialog('Chấm lại 3 bài nộp');
    expect(invalidatedKeys(queryClient, lists)).toEqual(lists);
  });
});
