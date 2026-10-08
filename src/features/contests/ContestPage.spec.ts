import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestProblem } from '@/test/fixtures';
import { pixelsOf, pixelsOfKind } from '@/test/bit-pixels';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

/** 08:00Z to 11:24:37Z, frozen for the last 60 minutes (from 10:24:37Z). */
const running = contestDetail();
const RUNNING_NOW = Date.parse('2026-10-08T09:37:07Z');
const BEFORE_START = Date.parse('2026-10-08T07:59:58Z');
const UPCOMING = contestDetail({ phase: 'upcoming' });

describe('contest detail header', () => {
  beforeEach(() => vi.stubEnv('TZ', 'UTC'));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('shows the phase, format, authors, the freeze-marked window and the time left', async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(running) });
    const { wrapper } = await mountApp('/contests/r42');
    const header = wrapper.get('[data-testid="contest-header"]');
    expect(header.get('h1').text()).toBe('QHH Round #42 (Div. 2)');
    expect(header.text()).toContain('Đang diễn ra');
    expect(header.text()).toContain('ICPC');
    expect(header.text()).toContain('thayhung');
    expect(header.get('[data-testid="freeze-label"]').text()).toBe('10:24 đóng băng');
    expect(header.get('[role="timer"]').text()).toBe('01:47:30');
    expect(header.text()).toContain('Kết thúc lúc 11:24');
    expect(header.text()).toContain('đã qua 1 giờ 37 phút');
    expect(document.title).toContain('QHH Round #42 (Div. 2)');
  });

  it('marks no freeze for a format that never freezes the board', async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail({ formatName: 'ioi' })) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="freeze-label"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="freeze-hatch"]').exists()).toBe(false);
  });

  it('hatches the frozen stretch from the freeze point to the bar end', async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    /** 08:00 to 12:00 frozen for 60 minutes: the freeze sits at 75% of the bar. */
    const frozenLastHour = contestDetail({
      endTime: '2026-10-08T12:00:00Z',
      frozenLastMinutes: 60,
    });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(frozenLastHour) });
    const { wrapper } = await mountApp('/contests/r42');
    const hatchStyle = wrapper.get('[data-testid="freeze-hatch"]').attributes('style') ?? '';
    expect(hatchStyle).toContain('left: 75%');
    expect(hatchStyle).toContain('width: 25%');
  });

  it('puts a Bit beside the countdown while the contest runs, and not the upcoming one', async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(running) });
    const { wrapper } = await mountApp('/contests/r42');
    const header = wrapper.get('[data-testid="contest-header"]');
    expect(pixelsOf(header.get('[data-testid="inline-bit"]').element)).toBe(
      pixelsOfKind('contest'),
    );
    expect(header.find('[data-testid="countdown-bit"]').exists()).toBe(false);
  });

  it('counts to the start of an upcoming contest and says the problems come with it', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T07:17:45Z'), toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(UPCOMING) });
    const { wrapper } = await mountApp('/contests/r42');
    const header = wrapper.get('[data-testid="contest-header"]');
    expect(header.text()).toContain('Kỳ thi chưa bắt đầu');
    expect(header.get('[role="timer"]').text()).toBe('00:42:15');
    expect(header.text()).toContain('Bắt đầu lúc 08:00');
  });

  it('has no countdown once the contest is over', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-09T00:00:00Z'), toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail({ phase: 'ended' })) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[role="timer"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="contest-header"]').text()).toContain('Đã kết thúc lúc 11:24');
  });

  it('follows the clock into the running phase before the refetch answers', async () => {
    vi.useFakeTimers({ now: BEFORE_START, toFake: ['Date', 'setInterval', 'clearInterval'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(UPCOMING) });
    const { wrapper } = await mountApp('/contests/r42');
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(wrapper.get('[data-testid="contest-header"]').text()).toContain('Đang diễn ra');
  });

  it('refetches once when the countdown elapses, and follows the new phase', async () => {
    vi.useFakeTimers({ now: BEFORE_START, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(running),
      'GET /contests/r42': sequence(ok(UPCOMING), ok(running)),
    });
    const { wrapper } = await mountApp('/contests/r42');
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(calls.filter((call) => call.path === '/contests/r42')).toHaveLength(2);
    expect(wrapper.get('[data-testid="contest-header"]').text()).toContain('Đang diễn ra');
    expect(wrapper.get('[role="timer"]').text()).toMatch(/^03:24:3\d$/);
  });

  it('asks once more after 1.5 s when the server still reports the old phase', async () => {
    vi.useFakeTimers({
      now: BEFORE_START,
      toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(running),
      'GET /contests/r42': sequence(ok(UPCOMING), ok(UPCOMING), ok(running)),
    });
    await mountApp('/contests/r42');
    const detailCalls = () => calls.filter((call) => call.path === '/contests/r42').length;
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(detailCalls()).toBe(2);
    vi.advanceTimersByTime(1500);
    await flushPromises();
    expect(detailCalls()).toBe(3);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(detailCalls()).toBe(3);
  });

  it('shows a missing contest with the crying Bit and a way back to the list, without a retry', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/nope': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/contests/nope');
    const missing = wrapper.get('[data-testid="contest-not-found"]');
    expect(missing.get('h1').text()).toBe('Không tìm thấy kỳ thi');
    expect(missing.find('[data-testid="crying-bit"]').exists()).toBe(true);
    expect(missing.find('a[href="/contests"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="contest-header"]').exists()).toBe(false);
  });

  it('keeps the sweating Bit and a retry for other load errors', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/r42': fail(500, 'internal') });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.get('[role="alert"]').find('[data-testid="bit"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="contest-not-found"]').exists()).toBe(false);
  });

  it('places the countdown Bit on an upcoming contest only', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T07:17:45Z'), toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(UPCOMING) });
    const { wrapper } = await mountApp('/contests/r42');
    const bit = wrapper.get('[data-testid="countdown-bit"]');
    expect(pixelsOf(bit.element)).toBe(pixelsOfKind('contest'));
  });
});

describe('contest detail problems and rules', () => {
  const withProblems = contestDetail({
    problems: [contestProblem(0), contestProblem(1, { maxSubmissions: 20 }), contestProblem(2)],
  });

  it('lists each problem with its label, a link to the statement, its points and its attempt cap', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(withProblems) });
    const { wrapper } = await mountApp('/contests/r42');
    const rows = wrapper.findAll('[data-testid="contest-problems"] tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.get('th').text()).toBe('A');
    expect(rows[0]!.get('a[href="/problems/r42a"]').text()).toBe('Dãy số đẹp');
    expect(rows[0]!.text()).toContain('100');
    expect(rows[1]!.text()).toContain('Tối đa 20 lượt');
  });

  it('says when the problems will show instead of an empty table', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'upcoming', problems: null })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="contest-problems"] table').exists()).toBe(false);
    expect(wrapper.get('[data-testid="contest-problems"]').text()).toContain(
      'Đề bài sẽ hiện khi kỳ thi bắt đầu và bạn vào thi.',
    );
  });

  it('says the problems show as soon as the viewer joins while the contest runs', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'running', problems: null })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="contest-problems"] table').exists()).toBe(false);
    expect(wrapper.get('[data-testid="contest-problems"]').text()).toContain(
      'Đề bài sẽ hiện ngay khi bạn vào thi.',
    );
  });

  it('says the problems are not public once the contest has ended', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'ended', problems: null })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="contest-problems"] table').exists()).toBe(false);
    expect(wrapper.get('[data-testid="contest-problems"]').text()).toContain(
      'Đề bài chưa được công khai.',
    );
  });

  it('renders the introduction in the left column through UserContent and the rules in the aside', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(withProblems) });
    const { wrapper } = await mountApp('/contests/r42');
    const aside = wrapper.get('aside');
    expect(wrapper.get('[data-testid="contest-intro"] .user-content').html()).toContain(
      'Vòng tuần cho đội tuyển',
    );
    expect(aside.find('[data-testid="contest-intro"]').exists()).toBe(false);
    expect(aside.text()).toContain('ICPC · phạt 20 phút mỗi lần sai');
    expect(aside.text()).toContain('Cho phép sau khi kết thúc');
  });

  it('lists the problems on a phone as a list with their code and points', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(withProblems) });
    const { wrapper } = await mountApp('/contests/r42');
    const items = wrapper.findAll('[data-testid="contest-problems"] ul > li');
    expect(items).toHaveLength(3);
    expect(items[1]!.get('a[href="/problems/r42b"]').text()).toBe('B. Trò chơi trên cây');
    expect(items[1]!.text()).toContain('r42b · Tối đa 20 lượt · 100 điểm');
    expect(items[0]!.text()).toContain('r42a · 100 điểm');
    expect(items[0]!.text()).not.toContain('Tối đa');
  });

  it('reads the time limit as the time per participation', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ timeLimit: 3 * 3600, problems: null })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.get('aside').text()).toContain('3 giờ mỗi lượt kể từ lúc vào thi');
  });

  it('leaves the introduction out when the contest has none', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ descriptionHtml: '', problems: null })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const aside = wrapper.get('aside');
    expect(wrapper.find('[data-testid="contest-intro"]').exists()).toBe(false);
    expect(aside.text()).toContain('Thể thức & quy định');
  });
});
