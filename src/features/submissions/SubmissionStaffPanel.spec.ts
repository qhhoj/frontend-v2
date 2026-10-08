import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { FakeEventSource, installFakeEventSource } from '@/test/fake-event-source';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { signedInViewer, submissionPageRoutes } from '@/test/problem-routes';
import { problemDetail, submissionDetail } from '@/test/fixtures';

const finished = submissionDetail({
  status: 'D',
  result: 'TLE',
  viewer: { canAbort: false, canRejudge: true, canReject: true },
});
const pageRoutes = (detail = finished) => ({
  ...submissionPageRoutes(detail),
  [`GET /problems/${detail.problem!.code}`]: { body: { data: problemDetail() } },
});
const panelButton = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) =>
  wrapper.findAll('[data-testid="staff-panel"] button').find((button) => button.text() === text)!;

describe('SubmissionStaffPanel', () => {
  it('never shows to the owner who is not staff, even when the server flags abort for them', async () => {
    const running = submissionDetail({
      status: 'G',
      result: null,
      viewer: { canAbort: true, canRejudge: false, canReject: false },
    });
    mockApi({ ...signedInViewer(), ...pageRoutes(running) });
    const { wrapper } = await mountApp(`/submissions/${running.id}`);
    expect(wrapper.find('[data-testid="staff-panel"]').exists()).toBe(false);
  });

  it('rejudges after confirming and says so', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.rejudge_submission']),
      ...pageRoutes(),
      [`POST /submissions/${finished.id}/rejudge`]: { status: 204 },
    });
    const { wrapper } = await mountApp(`/submissions/${finished.id}`);
    await panelButton(wrapper, 'Chấm lại').trigger('click');
    await flushPromises();
    expect(openDialog().textContent).toContain('Kết quả hiện tại (TLE');
    expect(calls.some((call) => call.path.endsWith('/rejudge'))).toBe(false);
    await confirmDialog('Chấm lại');
    expect(calls.some((call) => call.path.endsWith('/rejudge') && call.method === 'POST')).toBe(
      true,
    );
    expect(wrapper.get('[data-testid="staff-panel"] [role="status"]').text()).toContain(
      'Đã gửi chấm lại.',
    );
  });

  it('turns a 409 into the locked text with Bit, never a crash', async () => {
    mockApi({
      ...staffViewer(['judge.rejudge_submission']),
      ...pageRoutes(),
      [`POST /submissions/${finished.id}/rejudge`]: fail(409, 'conflict'),
    });
    const { wrapper } = await mountApp(`/submissions/${finished.id}`);
    await panelButton(wrapper, 'Chấm lại').trigger('click');
    await flushPromises();
    await confirmDialog('Chấm lại');
    expect(wrapper.get('[data-testid="staff-panel"] [role="alert"]').text()).toContain(
      'Bài nộp bị khóa, đang chờ chấm cuối kỳ thi hoặc đang được chấm',
    );
  });

  it('turns a 403 (no edit rights on this problem) into text', async () => {
    mockApi({
      ...staffViewer(['judge.reject_submission']),
      ...pageRoutes(),
      [`POST /submissions/${finished.id}/reject`]: fail(403, 'forbidden'),
    });
    const { wrapper } = await mountApp(`/submissions/${finished.id}`);
    await panelButton(wrapper, 'Từ chối bài nộp').trigger('click');
    await flushPromises();
    await confirmDialog('Từ chối');
    expect(wrapper.get('[data-testid="staff-panel"] [role="alert"]').text()).toContain(
      'Bạn không có quyền làm việc này.',
    );
  });

  it('draws the lock line and a disabled rejudge once the lock time has passed', async () => {
    const locked = submissionDetail({
      status: 'D',
      result: 'TLE',
      lockedAfter: '2026-10-08T11:00:00.000Z',
      viewer: { canAbort: false, canRejudge: false, canReject: true },
    });
    mockApi({
      ...staffViewer(['judge.rejudge_submission', 'judge.reject_submission']),
      ...pageRoutes(locked),
    });
    const { wrapper } = await mountApp(`/submissions/${locked.id}`);
    expect(wrapper.get('[data-testid="staff-panel"]').text()).toContain('bị khóa từ');
    expect(panelButton(wrapper, 'Chấm lại').attributes('aria-disabled')).toBe('true');
  });
  const queued = submissionDetail({
    id: finished.id,
    status: 'QU',
    result: null,
    points: null,
    viewer: { canAbort: false, canRejudge: false, canReject: false },
  });

  it('refetches the row after a rejudge, so the panel shows the new state and the live stream follows the queued row', async () => {
    installFakeEventSource();
    let isRejudged = false;
    const calls = mockApi({
      ...staffViewer(['judge.rejudge_submission']),
      ...pageRoutes(),
      [`GET /submissions/${finished.id}`]: () => ok(isRejudged ? queued : finished),
      [`POST /submissions/${finished.id}/rejudge`]: () => {
        isRejudged = true;
        return { status: 204 };
      },
    });
    const { wrapper } = await mountApp(`/submissions/${finished.id}`);
    await panelButton(wrapper, 'Chấm lại').trigger('click');
    await flushPromises();
    await confirmDialog('Chấm lại');
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="staff-panel"]').text()).toContain('Chờ chấm xong.'),
    );
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === `/submissions/${finished.id}`)
        .length,
    ).toBeGreaterThan(1);
    expect(FakeEventSource.instances.at(-1)?.url).toContain(`/events/submissions/${finished.id}`);
  });

  it('sends no second request for a rejudge the row has not yet reflected', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.rejudge_submission']),
      ...pageRoutes(),
      [`POST /submissions/${finished.id}/rejudge`]: { status: 204 },
    });
    const { wrapper } = await mountApp(`/submissions/${finished.id}`);
    await panelButton(wrapper, 'Chấm lại').trigger('click');
    await flushPromises();
    await confirmDialog('Chấm lại');
    expect(wrapper.get('[data-testid="staff-panel"] [role="status"]').text()).toContain(
      'Đã gửi chấm lại.',
    );
    await panelButton(wrapper, 'Chấm lại').trigger('click');
    await flushPromises();
    expect(panelButton(wrapper, 'Chấm lại').attributes('aria-disabled')).toBe('true');
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });
});
