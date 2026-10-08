import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, rateLimited } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { problemMeta } from '@/test/fixtures';

const PERMS = ['judge.rejudge_submission'];
const isDryRun = (call: ApiCall) => (call.body as { dryRun?: boolean }).dryRun === true;
const openConfirm = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  await wrapper.get('#rejudge-problem').setValue('hcmus41c');
  await wrapper.get('input[value="WA"]').setValue(true);
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Chấm lại các bài nộp này')!
    .trigger('click');
  await flushPromises();
  expect(openDialog().textContent).toContain('Số bài nộp khớp sẽ được báo sau khi xác nhận.');
};
const fillAndConfirm = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  await openConfirm(wrapper);
  await confirmDialog('Xác nhận chấm lại');
};
/** The screen is a lazy route: the form is there once its chunk has loaded. */
const mountRejudge = async () => {
  const mounted = await mountApp('/admin/rejudge');
  await vi.waitFor(() => expect(mounted.wrapper.find('#rejudge-problem').exists()).toBe(true));
  return mounted;
};
const routes = (post: Parameters<typeof mockApi>[0][string]) => ({
  ...staffViewer(PERMS),
  'GET /problems/meta': ok(problemMeta()),
  'POST /submissions/rejudge': post,
});

describe('BulkRejudgePage', () => {
  it('sends nothing before the confirm, then the filter, and reports the count the backend queued', async () => {
    const calls = mockApi(routes(ok({ count: 128, dryRun: false, allowed: true })));
    const { wrapper } = await mountRejudge();
    await openConfirm(wrapper);
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    await confirmDialog('Xác nhận chấm lại');
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      problem: 'hcmus41c',
      results: ['WA'],
    });
    expect(wrapper.get('[role="status"]').text()).toContain('Đã xếp lại 128 bài nộp.');
    expect(wrapper.find('[data-placement="done"]').exists()).toBe(true);
  });

  it('offers every result the backend accepts', async () => {
    mockApi(routes(ok({ count: 0, dryRun: false, allowed: true })));
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

  it('shows the drawn lot refusal only after a dry run says the account is not allowed, keeps the filter and claims no count', async () => {
    const calls = mockApi(
      routes((call) =>
        isDryRun(call) ? ok({ count: 40, dryRun: true, allowed: false }) : fail(403, 'forbidden'),
      ),
    );
    const { wrapper } = await mountRejudge();
    await fillAndConfirm(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Chấm lại hơn 10 bài nộp cần quyền judge.rejudge_submission_lot',
    );
    expect(wrapper.find('[data-placement="refused"]').exists()).toBe(true);
    expect(
      calls
        .filter((call) => call.method === 'POST')
        .map((call) => (isDryRun(call) ? 'dry' : 'real')),
    ).toEqual(['real', 'dry']);
    expect((wrapper.get('#rejudge-problem').element as HTMLInputElement).value).toBe('hcmus41c');
    expect(wrapper.text()).not.toContain('Đã xếp lại');
  });

  it('words any other 403 as a plain refusal, not as the lot permission', async () => {
    mockApi(
      routes((call) =>
        isDryRun(call) ? ok({ count: 3, dryRun: true, allowed: true }) : fail(403, 'forbidden'),
      ),
    );
    const { wrapper } = await mountRejudge();
    await fillAndConfirm(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain('Bạn không có quyền làm việc này.');
    expect(wrapper.get('[role="alert"]').text()).not.toContain('judge.rejudge_submission_lot');
  });

  it('sends nothing without a problem code', async () => {
    const calls = mockApi({ ...staffViewer(PERMS), 'GET /problems/meta': ok(problemMeta()) });
    const { wrapper } = await mountRejudge();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Chấm lại các bài nộp này')!
      .trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(wrapper.get('#rejudge-problem').attributes('aria-invalid')).toBe('true');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });
  it('words a dry run that is rate limited as a wait, not as the lot refusal or a plain refusal', async () => {
    mockApi(routes((call) => (isDryRun(call) ? rateLimited(30) : fail(403, 'forbidden'))));
    const { wrapper } = await mountRejudge();
    await fillAndConfirm(wrapper);
    const alert = wrapper.get('[role="alert"]').text();
    expect(alert).toContain('Thử lại sau 30 giây.');
    expect(alert).not.toContain('judge.rejudge_submission_lot');
    expect(alert).not.toContain('Bạn không có quyền làm việc này.');
  });

  it('words a server error on the dry run as a failure, not as a refusal', async () => {
    mockApi(
      routes((call) => (isDryRun(call) ? fail(500, 'internal_error') : fail(403, 'forbidden'))),
    );
    const { wrapper } = await mountRejudge();
    await fillAndConfirm(wrapper);
    const alert = wrapper.get('[role="alert"]').text();
    expect(alert).toContain('Đã có lỗi xảy ra. Hãy thử lại.');
    expect(alert).not.toContain('judge.rejudge_submission_lot');
    expect(alert).not.toContain('Bạn không có quyền làm việc này.');
  });
});
