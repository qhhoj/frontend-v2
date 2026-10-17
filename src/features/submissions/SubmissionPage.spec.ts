import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeEventSource, latestEventSource, pageStreams } from '@/test/fake-event-source';
import {
  contestDetail,
  contestProblem,
  participationSummary,
  problemDetail,
  submissionCase,
  submissionDetail,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, ok, sequence } from '@/test/mock-api';
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

  it('explains an internal error in plain words, with the judge message only when the API sent it (staff)', async () => {
    const internalError = (error: string | null) =>
      submissionDetail({ status: 'IE', result: 'IE', points: null, error });
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(internalError(null)),
      ...problemPageRoutes(),
    });
    const contestant = (await openSubmission('sub-1')).wrapper;
    const notice = contestant.get('[data-testid="internal-error"]');
    expect(notice.text()).toContain('Ban quản trị sẽ kiểm tra lại');
    expect(notice.text()).not.toContain('IE');
    expect(notice.find('[data-testid="internal-error-message"]').exists()).toBe(false);
    contestant.unmount();

    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(internalError('checker failed with exit code 3')),
      ...problemPageRoutes(),
    });
    const staff = (await openSubmission('sub-1')).wrapper;
    expect(staff.get('[data-testid="internal-error-message"]').text()).toBe(
      'checker failed with exit code 3',
    );
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

  it("offers no Nộp lại on another user's submission", async () => {
    const stranger = { id: 'someone-else', username: 'stranger', rating: null };
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

  it('shows a visitor the result and the tests, and locks the source behind sign-in without asking for it', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...submissionPageRoutes(submissionDetail({ sourceAccess: 'sign_in' })),
      ...problemPageRoutes(),
    });
    const { wrapper, router } = await openSubmission('sub-1');
    expect(router.currentRoute.value.name).toBe('submission');
    expect(wrapper.findAll('[data-testid="case-row"]')).toHaveLength(3);
    expect(wrapper.get('[data-testid="hero-line"]').text()).toContain('Test 3 sai kết quả');
    await flushPromises();
    expect(wrapper.get('[data-testid="source-locked"]').text()).toContain('Đăng nhập');
    expect(calls.some((call) => call.path.endsWith('/source'))).toBe(false);
    expect(wrapper.find('[data-testid="compare-open"]').exists()).toBe(false);
    expect(wrapper.find('a[href*="resubmit"]').exists()).toBe(false);
  });

  it('gives the author Nộp lại as the one primary action, beside the way back to the problem', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionPageRoutes(),
      ...problemPageRoutes(),
    });
    const { wrapper } = await openSubmission('sub-1');
    const actions = wrapper.get('[data-testid="submission-hero"]').findAll('a');
    expect(actions.map((link) => link.text())).toEqual(['Về đề bài', 'Nộp lại']);
    expect(actions[1]!.attributes('href')).toContain('resubmit=sub-1');
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
});

describe("submission page in the viewer's running contest (P-14 B)", () => {
  const contest = contestDetail({
    formatName: 'ioi',
    problems: [contestProblem(0, { code: 'duongdi', partial: true }), contestProblem(1)],
  });
  const routes = (date = '2026-10-08T09:58:00Z') => ({
    ...signedInViewer(),
    ...submissionPageRoutes(submissionDetail({ date })),
    ...problemPageRoutes(problemDetail({ code: 'duongdi', partial: true, points: 100 })),
    ...contestPageRoutes(contest),
    'GET /contests/current': ok({ contest, participation: participationSummary() }),
  });
  beforeEach(() =>
    vi.useFakeTimers({
      now: Date.parse('2026-10-08T10:00:00Z'),
      toFake: ['Date', 'setTimeout', 'clearTimeout'],
    }),
  );

  it('scores it in contest points first, names the contest and offers the next problem', async () => {
    mockApi(routes());
    const { wrapper } = await openSubmission('sub-1');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="submission-next"]').exists()).toBe(true),
    );
    // 7 of 20 case points of a 100-point partial contest problem.
    expect(wrapper.get('[data-testid="score"]').text()).toBe('35 / 100 điểm kỳ thi');
    expect(wrapper.get('[data-testid="hero-line"]').text()).toMatch(/^Điểm bài /);
    expect(wrapper.get('nav[aria-label="Đường dẫn"]').text()).toContain('QHH Round #42 (Div. 2)');
    expect(wrapper.get('h1').text()).toBe('A. Đường đi ngắn nhất');
    expect(wrapper.get('[data-testid="submission-next"] a').text()).toContain('Bài B');
    expect(wrapper.find('[data-fact="contest"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="submission-facts"]').text()).toContain('phút 118');
  });

  it('keeps the problem score for a submission made before the run started', async () => {
    const calls = mockApi(routes('2026-10-08T07:00:00Z'));
    const { wrapper } = await openSubmission('sub-1');
    // The run and the contest's problems are known, so the page has decided.
    await vi.waitFor(() =>
      expect(calls.some((call) => call.path === `/contests/${contest.key}`)).toBe(true),
    );
    await flushPromises();
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\/ 100/);
    expect(wrapper.find('[data-testid="submission-next"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="score"]').text()).not.toContain('kỳ thi');
  });
});
