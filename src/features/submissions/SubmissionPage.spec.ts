import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { installFakeEventSource, latestEventSource, pageStreams } from '@/test/fake-event-source';
import { sessionUser, submissionCase, submissionDetail } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import {
  anonymousViewer,
  problemPageRoutes,
  signedInViewer,
  submissionPageRoutes,
} from '@/test/problem-routes';

const grading = () =>
  submissionDetail({
    status: 'G',
    result: null,
    points: null,
    casePoints: 7,
    caseTotal: 20,
    currentTestcase: 3,
  });
const sourceRoute = { 'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'x' }) };
const detailCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path === '/submissions/sub-1');

const openSubmission = async (id: string) => {
  const mounted = await mountApp(`/submissions/${id}`);
  await vi.waitFor(() => expect(mounted.wrapper.find('[data-testid="score"]').exists()).toBe(true));
  return mounted;
};

beforeEach(() => {
  installFakeEventSource();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => vi.useRealTimers());

describe('submission page', () => {
  it('shows the pulse line, the ring in tests, the provisional score and the graded rows while grading', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading()), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Đã chấm 3 trên 20 test');
    expect(wrapper.get('[data-testid="score"]').text()).toBe('560');
    expect(wrapper.find('[data-testid="provisional"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="grading-line"]').text()).toContain('Đang chấm');
    expect(wrapper.findAll('[data-testid="case-row"]')).toHaveLength(3);
    expect(wrapper.findAll('[data-testid="pending-row"]')).toHaveLength(17);
  });

  it('refetches the row once, 400 ms after a burst of test-case events, and shows the new rows', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      ...sourceRoute,
      'GET /submissions/sub-1': sequence(
        ok(grading()),
        ok({
          ...grading(),
          cases: [...grading().cases!, submissionCase({ position: 4 })],
          currentTestcase: 6,
        }),
      ),
    });
    const { wrapper } = await openSubmission('sub-1');
    for (const testcase of [4, 5, 6])
      latestEventSource().emit('test-case', {
        submissionId: 'sub-1',
        type: 'test-case',
        status: 'G',
        currentTestcase: testcase,
      });
    await vi.advanceTimersByTimeAsync(399);
    expect(detailCalls(calls)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(detailCalls(calls)).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="case-row"]')).toHaveLength(4);
  });

  it('drops a pending refetch when the page is left', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(grading()),
      ...problemPageRoutes(),
    });
    const { wrapper } = await openSubmission('sub-1');
    latestEventSource().emit('test-case', {
      submissionId: 'sub-1',
      type: 'test-case',
      status: 'G',
      currentTestcase: 4,
    });
    await flushPromises();
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(detailCalls(calls)).toHaveLength(1);
  });

  it('shows the final points and drops the grading line when the stream says done, with one final read of the row', async () => {
    const final = () => ok(submissionDetail({ status: 'D', result: 'AC', points: 1600 }));
    const calls = mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      ...sourceRoute,
      'GET /submissions/sub-1': sequence(ok(grading()), final(), final()),
    });
    const { wrapper } = await openSubmission('sub-1');
    latestEventSource().emit('test-case', {
      submissionId: 'sub-1',
      type: 'test-case',
      status: 'G',
      currentTestcase: 4,
    });
    await flushPromises(); // the refetch of the last test case is now waiting
    latestEventSource().emit('done', {
      submissionId: 'sub-1',
      type: 'done',
      status: 'D',
      currentTestcase: 0,
    });
    await vi.waitFor(() => expect(wrapper.get('[data-testid="score"]').text()).toContain('1600'));
    expect(wrapper.find('[data-testid="grading-line"]').exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1000); // the debounced refetch of the last test case must be gone
    await flushPromises();
    expect(detailCalls(calls)).toHaveLength(3); // open, the stream's final read, the list invalidation
  });

  it('shows the reload hint when the stream is gone and the row never confirmed an end', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading()), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    latestEventSource().fail();
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="stale-reload"]').exists()).toBe(true),
    );
    expect(wrapper.get('[data-testid="stale-reload"] button').text()).toBe('Tải lại');
    expect(
      wrapper
        .get('[data-testid="stale-reload"] [data-testid="inline-bit"]')
        .attributes('aria-hidden'),
    ).toBe('true');
    expect(wrapper.find('[data-testid="grading-line"]').exists()).toBe(false);
  });

  it('opens no stream for a finished row or for a PD row and shows PD without a grading line', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(submissionDetail()),
      ...problemPageRoutes(),
    });
    await openSubmission('sub-1');
    expect(pageStreams()).toHaveLength(0);
    const pending = submissionDetail({
      status: 'PD',
      result: null,
      points: null,
      cases: null,
      totalCases: null,
    });
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(pending), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    expect(pageStreams()).toHaveLength(0);
    expect(wrapper.text()).toContain('Chờ chấm cuối kỳ thi');
    expect(wrapper.find('[data-testid="grading-line"]').exists()).toBe(false);
  });

  it('shows totals and a clear message, never an empty table, when the case results are hidden', async () => {
    const hidden = {
      ...grading(),
      cases: null,
      batches: null,
      totalCases: null,
    };
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(hidden), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    expect(wrapper.text()).toContain('Người xem không được xem kết quả từng test');
    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Đã được 35% điểm');
  });

  it('shows the source right under the verdict, before the test cases', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(submissionDetail()),
      ...problemPageRoutes(),
    });
    const { wrapper } = await openSubmission('sub-1');
    const html = wrapper.get('#main').html();
    const source = html.indexOf('id="source"');
    expect(source).toBeGreaterThan(-1);
    expect(source).toBeLessThan(html.indexOf('data-testid="cases-card"'));
  });

  it('shows the compile message of a compile error', async () => {
    const compileError = submissionDetail({
      status: 'CE',
      result: 'CE',
      points: 0,
      cases: null,
      batches: null,
      totalCases: null,
      error: 'main.cpp:3: error: expected ;',
    });
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(compileError), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    expect(wrapper.findAll('#main pre').map((pre) => pre.text())).toContain(
      'main.cpp:3: error: expected ;',
    );
    expect(wrapper.text()).toContain('Lỗi biên dịch');
  });

  it.each([
    ['solve_first', 'Giải bài này trước để xem bài nộp'],
    ['contest_running', 'Kỳ thi đang diễn ra, chưa thể xem bài nộp của người khác'],
    ['hidden', 'Bạn không có quyền xem bài nộp này'],
  ])('explains the 403 reason %s on the detail and shows no summary', async (code, text) => {
    mockApi({ ...signedInViewer(), 'GET /submissions/sub-1': fail(403, code) });
    const { wrapper } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(wrapper.text()).toContain(text));
    expect(wrapper.find('[role="img"]').exists()).toBe(false);
  });

  it('says the generic forbidden text for a 403 without a known reason', async () => {
    mockApi({ ...signedInViewer(), 'GET /submissions/sub-1': fail(403, 'forbidden') });
    const { wrapper } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Bạn không có quyền làm việc này.'));
    const bit = wrapper.get('[data-testid="inline-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
  });

  it('renders not-found in place for a 404', async () => {
    mockApi({ ...signedInViewer(), 'GET /submissions/sub-1': fail(404, 'not_found') });
    const { wrapper, router } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="requested-path"]').exists()).toBe(true),
    );
    expect(router.currentRoute.value.path).toBe('/submissions/sub-1');
  });

  it('keeps the summary when only the source is forbidden', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(),
      ...problemPageRoutes(),
      'GET /submissions/sub-1/source': fail(403, 'hidden'),
    });
    const { wrapper } = await openSubmission('sub-1');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Bạn không có quyền xem bài nộp này'));
    expect(wrapper.find('[role="img"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="case-row"]').length).toBeGreaterThan(0);
  });

  it('falls back to the problem name of the row when the problem is not readable', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(),
      'GET /problems/duongdi': fail(403, 'forbidden'),
    });
    const { wrapper } = await openSubmission('sub-1');
    expect(wrapper.get('a[href="/problems/duongdi"]').text()).toBe('Đường đi ngắn nhất');
  });

  it('links Nộp lại to the problem with ?resubmit=<id>', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/problems/duongdi?resubmit=sub-1"]').exists()).toBe(true),
    );
  });

  it('names the tab after the short submission id', async () => {
    const longId = '0192a000-aaaa-7000-8000-000000000abc';
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(submissionDetail({ id: longId })),
      ...problemPageRoutes(),
    });
    await openSubmission(longId);
    expect(document.title).toBe('Bài nộp #0192a0…abc · QHHOJ');
  });

  it("offers no Nộp lại on another user's submission", async () => {
    const stranger = { id: 'someone-else', username: 'stranger' };
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(submissionDetail({ user: stranger })),
      ...problemPageRoutes(),
      ...sourceRoute,
    });
    const { wrapper } = await openSubmission('sub-1');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Mã nguồn'));
    expect(wrapper.find('a[href*="resubmit"]').exists()).toBe(false);
  });

  it('announces the status in one polite region inside the page and keeps it unchanged between test-case events', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading()), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    const region = () => wrapper.findAll('#main [role="status"][aria-live="polite"]');
    expect(region()).toHaveLength(1);
    const before = region()[0]!.text();
    expect(before).toBe('Đang chấm');
    for (const testcase of [4, 5])
      latestEventSource().emit('test-case', {
        submissionId: 'sub-1',
        type: 'test-case',
        status: 'G',
        currentTestcase: testcase,
      });
    await flushPromises();
    expect(region()[0]!.text()).toBe(before);
  });

  it('sends an anonymous viewer to sign in and keeps the address', async () => {
    mockApi({ ...anonymousViewer, ...loginRoutes });
    const { router } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
    expect(router.currentRoute.value.query.redirect).toBe('/submissions/sub-1');
  });

  it("does not reuse the previous account's row after the account changes", async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      ...sourceRoute,
      'GET /submissions/sub-1': sequence(
        ok(submissionDetail({ result: 'AC', points: 1600 })),
        fail(403, 'hidden'),
      ),
    });
    const { wrapper } = await openSubmission('sub-1');
    useSessionStore().user = sessionUser({
      id: '0192a000-0000-7000-8000-000000000002',
      username: 'user_02',
    });
    await vi.waitFor(() => expect(detailCalls(calls)).toHaveLength(2));
    await vi.waitFor(() => expect(wrapper.text()).toContain('Bạn không có quyền xem bài nộp này'));
    expect(wrapper.find('[role="img"]').exists()).toBe(false);
  });

  it('opens a second stream and drops the hint when the reload button is pressed after the stream was lost', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading()), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    latestEventSource().fail();
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="stale-reload"]').exists()).toBe(true),
    );
    await wrapper.get('[data-testid="stale-reload"] button').trigger('click');
    await vi.waitFor(() => expect(pageStreams()).toHaveLength(2));
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="stale-reload"]').exists()).toBe(false),
    );
    expect(wrapper.find('[data-testid="grading-line"]').exists()).toBe(true);
  });

  it('numbers a source that ends in a newline without a phantom last line', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(),
      ...problemPageRoutes(),
      'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'int main() {}\n' }),
    });
    const { wrapper } = await openSubmission('sub-1');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="source-expand"]').exists()).toBe(true),
    );
    await wrapper.get('[data-testid="source-expand"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.find('pre[aria-hidden="true"]').exists()).toBe(true));
    expect(wrapper.get('pre[aria-hidden="true"]').text()).toBe('1');
  });

  it('never announces a bare final status while the final read is on its way, and shows no provisional score beside the final verdict', async () => {
    const final = ok(submissionDetail({ status: 'D', result: 'AC', points: 1600 }));
    let rowReads = 0;
    let releaseFinalRead = () => {};
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      ...sourceRoute,
      'GET /submissions/sub-1': () => (++rowReads === 1 ? ok(grading()) : final),
    });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).endsWith('/submissions/sub-1') && rowReads === 1
        ? new Promise<Response>((resolve) => {
            releaseFinalRead = () => resolve(served(input, init));
          })
        : served(input, init),
    );
    const { wrapper } = await openSubmission('sub-1');
    const region = () => wrapper.get('#main [role="status"][aria-live="polite"]').text();
    latestEventSource().emit('done', {
      submissionId: 'sub-1',
      type: 'done',
      status: 'D',
      currentTestcase: 0,
    });
    await flushPromises();
    expect(region()).toBe('Đang chấm');
    releaseFinalRead();
    await vi.waitFor(() => expect(region()).toBe('Chấp nhận'));
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="provisional"]').exists()).toBe(false),
    );
  });

  it('refetches during a long burst of test cases at least every 2 seconds', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(grading()),
      ...problemPageRoutes(),
    });
    await openSubmission('sub-1');
    for (let testcase = 4; testcase <= 10; testcase++) {
      latestEventSource().emit('test-case', {
        submissionId: 'sub-1',
        type: 'test-case',
        status: 'G',
        currentTestcase: testcase,
      });
      await vi.advanceTimersByTimeAsync(300);
    }
    await flushPromises();
    expect(detailCalls(calls).length).toBeGreaterThanOrEqual(2);
  });

  it('shows the next submission after the address changes and carries nothing over', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      ...submissionPageRoutes(grading()),
      ...submissionPageRoutes(submissionDetail({ id: 'sub-2', result: 'AC', points: 1600 })),
    });
    const { wrapper, router } = await openSubmission('sub-1');
    const firstStream = latestEventSource();
    await router.push('/submissions/sub-2');
    await vi.waitFor(() => expect(wrapper.get('[data-testid="score"]').text()).toContain('1600'));
    expect(firstStream.closed).toBe(true);
    expect(wrapper.find('[data-testid="pending-row"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="stale-reload"]').exists()).toBe(false);
    expect(pageStreams()).toHaveLength(1);
  });

  it('shows the verdict before the problem arrives and a skeleton in the points cell only', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/problems/duongdi')
        ? new Promise<Response>(() => {})
        : served(input, init),
    );
    const { wrapper } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="score"]').exists()).toBe(true));
    expect(wrapper.text()).toContain('WA · Sai kết quả');
    expect(wrapper.get('[data-testid="score"]').text()).toBe('');
    expect(wrapper.find('[data-testid="score"] [data-skeleton]').exists()).toBe(true);
  });

  it('fills the ring of a final row in the verdict colour and shows when it was submitted', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Sai kết quả');
    expect(wrapper.get('[role="img"]').attributes('style')).toContain('--qh-verdict-wa');
    expect(wrapper.get('time').attributes('title')).toMatch(/2026/);
  });

  it.each([
    ['AC', 'Bit đội vương miện'],
    ['WA', 'Bit toát mồ hôi'],
    ['TLE', 'Bit toát mồ hôi'],
  ] as const)('shows Bit for a final %s: %s', async (result, label) => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(submissionDetail({ result })),
      ...problemPageRoutes(),
    });
    const { wrapper } = await openSubmission('sub-1');
    expect(
      wrapper.get(`[data-testid="submission-summary"] [aria-label="${label}"]`).attributes('role'),
    ).toBe('img');
  });

  it('shows no Bit while the submission is still grading', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(grading()), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    const summary = wrapper.get('[data-testid="submission-summary"]');
    expect(summary.find('[aria-label^="Bit"]').exists()).toBe(false);
  });

  it('shows an empty neutral ring, never a green percentage, for a result that is pending until the contest ends', async () => {
    const pending = submissionDetail({
      status: 'PD',
      result: null,
      points: null,
      cases: null,
      totalCases: null,
    });
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(pending), ...problemPageRoutes() });
    const { wrapper } = await openSubmission('sub-1');
    const ring = wrapper.get('[role="img"]');
    expect(ring.attributes('aria-label')).toBe('Chờ chấm cuối kỳ thi');
    expect(ring.text()).not.toContain('%');
    expect(ring.attributes('style')).not.toContain('--qh-positive');
  });

  it('compares with another submission given by id or link, this one on the right', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(),
      ...problemPageRoutes(),
      ...submissionPageRoutes(submissionDetail({ id: 'sub-2' })),
    });
    const { wrapper, router } = await openSubmission('sub-1');
    const form = wrapper.get('[data-testid="compare-form"]');
    await form.get('input').setValue('https://qhhoj.vn/submissions/sub-2');
    await form.trigger('submit');
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/submissions/diff?left=sub-2&right=sub-1'),
    );
  });

  it('refuses an unreadable or identical id in the compare form, with the reason', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const { wrapper, router } = await openSubmission('sub-1');
    const form = wrapper.get('[data-testid="compare-form"]');
    await form.get('input').setValue('not an id!');
    await form.trigger('submit');
    expect(form.get('[role="alert"]').text()).toBe(
      'Nhập mã bài nộp hoặc dán liên kết của một bài nộp.',
    );
    await form.get('input').setValue('sub-1');
    await form.trigger('submit');
    expect(form.get('[role="alert"]').text()).toBe('Hãy chọn một bài nộp khác bài này.');
    expect(form.get('input').attributes('aria-invalid')).toBe('true');
    expect(router.currentRoute.value.name).toBe('submission');
  });
});
