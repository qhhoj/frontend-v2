import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { submissionItem } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer, submissionListRoutes } from '@/test/problem-routes';

async function openList(path = '/submissions') {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('tbody tr').exists()).toBe(true));
  return mounted;
}
const scrollIntoView = vi.fn();
beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => vi.unstubAllGlobals());

describe('the submission list page', () => {
  it('renders the strip, the rail and one row per submission with a verdict code, its name and a link to the detail', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper } = await openList();
    expect(wrapper.find('[data-testid="stats-strip"]').exists()).toBe(true);
    const row = wrapper.get('tbody tr[data-id="sub-1"]');
    expect(row.text()).toContain('AC');
    expect(row.text()).toContain('Chấp nhận');
    expect(row.get('a').attributes('href')).toBe('/submissions/sub-1');
  });

  it('opens the submission when a row is clicked away from its links, and links the source with #source', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const row = wrapper.get('tbody tr[data-id="sub-1"]');
    const source = row.get('a[aria-label="Xem mã nguồn"]');
    expect(source.attributes('href')).toBe('/submissions/sub-1#source');
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    await row.findAll('td')[2]!.trigger('click');
    expect(push).toHaveBeenCalledExactlyOnceWith({ name: 'submission', params: { id: 'sub-1' } });
  });

  it('leaves a click on an inner link to the link itself', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    await wrapper.get('tbody tr[data-id="sub-1"] a[aria-label="Xem mã nguồn"]').trigger('click');
    expect(push).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ hash: '#source', name: 'submission' }),
    );
  });

  it('shows score, time, memory, language and problem of a finished row, dashes for an unfinished one', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([
        submissionItem({ id: 'done' }),
        submissionItem({
          id: 'queued',
          status: 'QU',
          result: null,
          points: null,
          time: null,
          memory: null,
        }),
      ]),
    });
    const { wrapper } = await openList();
    const done = wrapper.get('tbody tr[data-id="done"]').text();
    for (const expected of ['100', '0.04s', 'C++17', 'Tổng hai số', 'user_01'])
      expect(done).toContain(expected);
    const queued = wrapper.findAll('tbody tr[data-id="queued"] td').map((cell) => cell.text());
    expect(queued).toContain('Đang chờ');
    expect(queued.filter((text) => text === '—')).toHaveLength(3);
  });

  it('asks for result=AC and writes it to the URL when Accepted is ticked', async () => {
    const calls = mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    await wrapper.get('input[type="checkbox"][value="AC"]').setValue(true);
    await vi.waitFor(() => expect(calls.at(-1)!.query.getAll('result')).toEqual(['AC']));
    // vue-router keeps the array a replace was given; a reloaded URL parses to the plain string.
    expect([router.currentRoute.value.query.result].flat()).toEqual(['AC']);
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
    expect(wrapper.find('tbody tr[data-id="sub-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="query-skeleton"] table').exists()).toBe(false);
  });

  it('shows a running row with its status text and a percentage, not a verdict', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([
        submissionItem({
          status: 'G',
          result: null,
          points: null,
          casePoints: 7,
          caseTotal: 20,
          time: null,
          memory: null,
        }),
      ]),
    });
    const { wrapper } = await openList();
    const row = wrapper.get('tbody tr');
    expect(row.text()).toContain('Đang chấm');
    expect(row.text()).toContain('35%');
    expect(row.text()).not.toContain('AC');
  });

  it('keeps the list when the stats cannot be read', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions/stats': fail(404, 'not_found'),
    });
    const { wrapper } = await openList();
    expect(wrapper.find('tbody tr').exists()).toBe(true);
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="stats-strip"]').text()).toContain('—'),
    );
  });

  it('shows the error state, not an empty table, when a filter makes the API answer 400', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': invalid(issue('result', 'is_in', 'x')),
    });
    const { wrapper } = await mountApp('/submissions');
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true));
    expect(wrapper.find('tbody').exists()).toBe(false);
  });

  it('mirrors the Live updates box in the URL', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    await wrapper.get('input[data-testid="live-toggle"]').setValue(false);
    await vi.waitFor(() => expect(router.currentRoute.value.query.live).toBe('0'));
  });

  it('goes to the next page with the pager and back to page 1 when a filter changes', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([submissionItem()], { total: 120 }),
    });
    const { wrapper, router } = await openList();
    await wrapper.get('nav[aria-label="Trang"] button[data-direction="next"]').trigger('click');
    await vi.waitFor(() => expect(calls.at(-1)!.query.get('page')).toBe('2'));
    expect(wrapper.get('nav[aria-label="Trang"]').text()).toContain('2 / 3');
    await wrapper.get('input[type="checkbox"][value="AC"]').setValue(true);
    await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBeUndefined());
  });

  it('scrolls the top of the list into view when the page changes, and not on other filter changes', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([submissionItem()], { total: 120 }),
    });
    const { wrapper } = await openList();
    await wrapper.get('input[type="checkbox"][value="AC"]').setValue(true);
    await flushPromises();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await wrapper.get('nav[aria-label="Trang"] button[data-direction="next"]').trigger('click');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    const scrolled = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(scrolled.contains(wrapper.get('tbody').element)).toBe(true);
    expect(scrolled.contains(wrapper.get('aside').element)).toBe(false);
  });

  it('names the active filters when nothing matches', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': page([]),
    });
    const { wrapper } = await mountApp('/submissions?result=IE&problem=duongdi');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Không có bài nộp phù hợp'));
    expect(wrapper.text()).toContain('IE');
    expect(wrapper.text()).toContain('duongdi');
  });

  it('says plainly when there are no submissions and no filter is set', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes, 'GET /submissions': page([]) });
    const { wrapper } = await mountApp('/submissions');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Chưa có bài nộp nào.'));
  });

  it('names each row link with the submission, its user, problem and verdict', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper } = await openList();
    expect(wrapper.get('tbody tr a').attributes('aria-label')).toBe(
      'Bài nộp #sub-1 của user_01 cho bài Tổng hai số: Chấp nhận',
    );
  });

  it('empties the URL (filters, page and Live updates) when Reset is clicked', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList('/submissions?result=AC&user=x&page=2&live=0');
    await wrapper.get('button[data-testid="filters-reset"]').trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}));
  });

  it('does not refetch when Live updates is toggled', async () => {
    const calls = mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    await wrapper.get('input[data-testid="live-toggle"]').setValue(false);
    await vi.waitFor(() => expect(router.currentRoute.value.query.live).toBe('0'));
    await flushPromises();
    expect(calls.filter((call) => call.path === '/submissions')).toHaveLength(1);
  });
});

describe('picking two submissions to compare', () => {
  const threeRows = page([
    submissionItem({ id: 's-1' }),
    submissionItem({ id: 's-2' }),
    submissionItem({ id: 's-3' }),
  ]);
  const boxOf = (wrapper: Awaited<ReturnType<typeof openList>>['wrapper'], id: string) =>
    wrapper.get(`tbody tr[data-id="${id}"] input[type="checkbox"]`);

  it('picks in order, left then right, and links to the diff', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openList();
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
    await boxOf(wrapper, 's-2').trigger('click');
    expect(wrapper.get('[data-testid="diff-selection"]').text()).toContain('Đã chọn 1 / 2 bài');
    expect(wrapper.get('[data-testid="diff-selection"] [aria-disabled="true"]').text()).toBe(
      'Chọn đủ 2 bài',
    );
    await boxOf(wrapper, 's-1').trigger('click');
    expect(wrapper.get('tbody tr[data-id="s-2"] [data-testid="pick-order"]').text()).toBe('1');
    expect(wrapper.get('tbody tr[data-id="s-1"] [data-testid="pick-order"]').text()).toBe('2');
    expect(wrapper.get('[data-testid="diff-compare"]').attributes('href')).toBe(
      '/submissions/diff?left=s-2&right=s-1',
    );
  });

  it('ignores a third tick and frees a slot on untick', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openList();
    await boxOf(wrapper, 's-1').trigger('click');
    await boxOf(wrapper, 's-2').trigger('click');
    expect(boxOf(wrapper, 's-3').attributes('aria-disabled')).toBe('true');
    await boxOf(wrapper, 's-3').trigger('click');
    expect((boxOf(wrapper, 's-3').element as HTMLInputElement).checked).toBe(false);
    await boxOf(wrapper, 's-1').trigger('click');
    await boxOf(wrapper, 's-3').trigger('click');
    expect(wrapper.get('[data-testid="diff-compare"]').attributes('href')).toBe(
      '/submissions/diff?left=s-2&right=s-3',
    );
    await wrapper.get('[data-testid="diff-clear"]').trigger('click');
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
  });

  it('drops the compare bar when the viewer signs out with picks made', async () => {
    mockApi({ ...signedInViewer(), ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openList();
    await boxOf(wrapper, 's-1').trigger('click');
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(true);
    useSessionStore().status = 'anonymous';
    await flushPromises();
    expect(wrapper.find('[data-testid="diff-selection"]').exists()).toBe(false);
  });

  it('shows no pick boxes to a signed-out viewer', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes, 'GET /submissions': threeRows });
    const { wrapper } = await openList();
    expect(wrapper.find('tbody input[type="checkbox"]').exists()).toBe(false);
  });
});
