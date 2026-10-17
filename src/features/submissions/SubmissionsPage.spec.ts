import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { participationSummary, submissionItem } from '@/test/fixtures';
import { fail, holdRequestsTo, invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer, submissionListRoutes } from '@/test/problem-routes';

async function openList(path = '/submissions') {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('[data-id]').exists()).toBe(true));
  return mounted;
}
const scrollIntoView = vi.fn();
beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => vi.unstubAllGlobals());

describe('the submission list page', () => {
  it('opens the submission when a row is clicked away from its links, and links the source with #source', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const row = wrapper.get('[data-id="sub-1"]');
    const source = row.get('a[aria-label="Xem mã nguồn"]');
    expect(source.attributes('href')).toBe('/submissions/sub-1#source');
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    await row.trigger('click');
    expect(push).toHaveBeenCalledExactlyOnceWith({ name: 'submission', params: { id: 'sub-1' } });
  });

  it('stays on the list when the click ends a text selection inside the row', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'C++17' } as Selection);
    await wrapper.get('[data-id="sub-1"]').trigger('click');
    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the previous rows on screen while the next page loads', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([submissionItem()], { total: 120 }),
    });
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('page=2') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper, router } = await openList();
    await router.replace({ query: { page: '2' } });
    await flushPromises();
    expect(wrapper.find('[data-id="sub-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="query-skeleton"] [data-skeleton]').exists()).toBe(false);
  });

  it('shows the error state, not an empty table, when a filter makes the API answer 400', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': invalid(issue('result', 'is_in', 'x')),
    });
    const { wrapper } = await mountApp('/submissions');
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true));
    expect(wrapper.find('[data-id]').exists()).toBe(false);
  });

  it('scrolls the top of the list into view when the page changes, and not on other filter changes', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([submissionItem()], { total: 120 }),
    });
    const { wrapper } = await openList();
    await wrapper.get('button[data-quick-filter="accepted"]').trigger('click');
    await flushPromises();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await wrapper.get('nav[aria-label="Trang"] a[href$="page=2"]').trigger('click');
    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    const scrolled = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(scrolled.contains(wrapper.get('[data-id]').element)).toBe(true);
    expect(scrolled.contains(wrapper.get('[role="search"]').element)).toBe(false);
  });

  it('opens the advanced panel by itself for a link that sets a filter only it shows', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const plain = await openList();
    expect(plain.wrapper.find('input[name="problem"]').exists()).toBe(false);
    const linked = await openList('/submissions?problem=aplusb');
    expect(linked.wrapper.get('input[name="problem"]').element).toHaveProperty('value', 'aplusb');
    expect(linked.wrapper.get('button[data-testid="advanced-filters"]').text()).toContain('1');
  });

  it('shows "Của tôi" only to a signed-in viewer, chosen for them on the bare list, and off stays off', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const anonymous = await openList();
    expect(anonymous.wrapper.find('button[data-quick-filter="mine"]').exists()).toBe(false);

    const calls = mockApi({ ...signedInViewer(), ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const username = useSessionStore().user!.username;
    const listCalls = () => calls.filter((call) => call.path === '/submissions');
    expect(listCalls().map((call) => call.query.get('user'))).toEqual([username]);
    expect(router.currentRoute.value.query.user).toBe(username);
    const mine = wrapper.get('button[data-quick-filter="mine"]');
    expect(mine.attributes('aria-pressed')).toBe('true');
    await mine.trigger('click');
    await vi.waitFor(() => expect(listCalls().at(-1)!.query.get('user')).toBeNull());
    await flushPromises();
    expect(router.currentRoute.value.query.user).toBeUndefined();
    expect(mine.attributes('aria-pressed')).toBe('false');
  });

  it('keeps a filter the viewer picks while "Của tôi" is still being decided', async () => {
    const calls = mockApi({ ...signedInViewer(), ...submissionListRoutes });
    holdRequestsTo('/contests/current');
    const { wrapper, router } = await mountApp('/submissions');
    await vi.waitFor(() =>
      expect(wrapper.find('button[data-quick-filter="accepted"]').exists()).toBe(true),
    );
    await wrapper.get('button[data-quick-filter="accepted"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.find('[data-id]').exists()).toBe(true));
    const listed = calls.filter((call) => call.path === '/submissions');
    expect(listed.map((call) => call.query.get('user'))).toEqual([null]);
    expect(router.currentRoute.value.query).toEqual({ result: ['AC'] });
  });

  it('shows the site feed when the session cannot be read', async () => {
    const calls = mockApi({ 'GET /auth/me': fail(500, 'internal'), ...submissionListRoutes });
    await openList();
    expect(calls.find((call) => call.path === '/submissions')!.query.get('user')).toBeNull();
  });

  it('keeps the site feed for a visitor, a filtered link and a viewer in a running contest', async () => {
    const visitorCalls = mockApi({ ...anonymousViewer, ...submissionListRoutes });
    await openList();
    expect(visitorCalls.find((call) => call.path === '/submissions')!.query.get('user')).toBeNull();

    const linkCalls = mockApi({ ...signedInViewer(), ...submissionListRoutes });
    await openList('/submissions?result=AC');
    const linked = linkCalls.find((call) => call.path === '/submissions')!;
    expect([linked.query.get('user'), linked.query.getAll('result')]).toEqual([null, ['AC']]);

    const contestCalls = mockApi({
      ...signedInViewer(),
      ...submissionListRoutes,
      'GET /contests/current': ok({
        contest: {
          key: 'r42',
          name: 'r42',
          startTime: '2026-01-01T00:00:00Z',
          endTime: '2999-01-01T00:00:00Z',
        },
        participation: participationSummary({ endTime: '2999-01-01T00:00:00Z' }),
      }),
      'GET /contests/r42/announcements': page([]),
    });
    await openList();
    expect(contestCalls.find((call) => call.path === '/submissions')!.query.get('user')).toBeNull();
  });
});

describe('the submission cards', () => {
  const judged = submissionItem({
    testSummary: {
      unit: 'case',
      statuses: ['AC', 'WA', 'TLE'],
      batches: [null, null, null],
      more: 0,
      total: 4,
    },
  });

  it('draws the per-test strip with a text line, so colour is not the only cue', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': page([judged]) });
    const { wrapper } = await openList();
    const strip = wrapper.get('[data-id="sub-1"] [data-testid="test-strip"]');
    expect(strip.get('[role="img"]').attributes('aria-label')).toBe('1/4 test đúng · 1 WA · 1 TLE');
    expect(strip.findAll('[title]').map((cell) => cell.attributes('title'))).toEqual([
      'Test 1: Chấp nhận (AC)',
      'Test 2: Sai kết quả (WA)',
      'Test 3: Quá thời gian (TLE)',
      'Test 4: chưa chấm',
    ]);
  });

  it('names the test under the strip as the arrow keys move along it', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': page([judged]) });
    const { wrapper } = await openList();
    const strip = wrapper.get('[data-testid="test-strip"] [role="img"]');
    await strip.trigger('focus');
    await strip.trigger('keydown', { key: 'ArrowRight' });
    await strip.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.get('[data-testid="test-strip"] p').text()).toBe('Test 2: Sai kết quả (WA)');
  });

  it('shows the card without a strip when the backend sends no summary (an older one omits the field)', async () => {
    // JSON drops an undefined field: the response has no `testSummary` at all, as an older backend's.
    const older = { ...judged, testSummary: undefined as unknown as null };
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': page([older]) });
    const { wrapper } = await openList();
    expect(wrapper.find('[data-id="sub-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="test-strip"]').exists()).toBe(false);
  });
});

describe('picking two submissions to compare', () => {
  const threeRows = page([
    submissionItem({ id: 's-1' }),
    submissionItem({ id: 's-2' }),
    submissionItem({ id: 's-3' }),
  ]);
  const boxOf = (wrapper: Awaited<ReturnType<typeof openList>>['wrapper'], id: string) =>
    wrapper.get(`[data-id="${id}"] input[type="checkbox"]`);
  /** Q-04 C: the boxes wait behind "So sánh". */
  async function openComparing() {
    const mounted = await openList();
    expect(mounted.wrapper.find('[data-id] input[type="checkbox"]').exists()).toBe(false);
    await mounted.wrapper.get('[data-testid="compare-mode"]').trigger('click');
    return mounted;
  }

  it('picks in order, left then right, and links to the diff', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openComparing();
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
    await boxOf(wrapper, 's-2').trigger('click');
    expect(wrapper.get('[data-testid="diff-selection"]').text()).toContain('Đã chọn 1 / 2 bài');
    expect(wrapper.get('[data-testid="diff-selection"] [aria-disabled="true"]').text()).toBe(
      'Chọn đủ 2 bài',
    );
    await boxOf(wrapper, 's-1').trigger('click');
    expect(wrapper.get('[data-id="s-2"] [data-testid="pick-order"]').text()).toBe('1');
    expect(wrapper.get('[data-id="s-1"] [data-testid="pick-order"]').text()).toBe('2');
    expect(wrapper.get('[data-testid="diff-compare"]').attributes('href')).toBe(
      '/submissions/diff?left=s-2&right=s-1',
    );
  });

  it('drops the picks when "So sánh" is turned off', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openComparing();
    await boxOf(wrapper, 's-1').trigger('click');
    await wrapper.get('[data-testid="compare-mode"]').trigger('click');
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
    expect(wrapper.find('[data-id] input[type="checkbox"]').exists()).toBe(false);
  });

  it('drops the compare bar when the viewer signs out with picks made', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openComparing();
    await boxOf(wrapper, 's-1').trigger('click');
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(true);
    useSessionStore().status = 'anonymous';
    await flushPromises();
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
  });

  it('shows no pick boxes and no "So sánh" to a signed-out viewer', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openList();
    expect(wrapper.find('[data-id] input[type="checkbox"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="compare-mode"]').exists()).toBe(false);
  });
});
