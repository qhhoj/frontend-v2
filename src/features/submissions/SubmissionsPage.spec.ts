import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { submissionItem } from '@/test/fixtures';
import { invalid, issue, mockApi, page } from '@/test/mock-api';
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

  it('stays on the list when the click ends a text selection inside the row', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper, router } = await openList();
    const push = vi.spyOn(router, 'push').mockResolvedValue(undefined);
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'C++17' } as Selection);
    await wrapper.get('tbody tr[data-id="sub-1"]').findAll('td')[2]!.trigger('click');
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
    expect(wrapper.find('tbody tr[data-id="sub-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="query-skeleton"] table').exists()).toBe(false);
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
    expect(scrolled.contains(wrapper.get('tbody').element)).toBe(true);
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

  it('shows "Của tôi" only to a signed-in viewer and filters by their username', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const anonymous = await openList();
    expect(anonymous.wrapper.find('button[data-quick-filter="mine"]').exists()).toBe(false);

    const calls = mockApi({ ...signedInViewer(), ...submissionListRoutes });
    const { wrapper } = await openList();
    const mine = wrapper.get('button[data-quick-filter="mine"]');
    await mine.trigger('click');
    const username = useSessionStore().user!.username;
    await vi.waitFor(() => expect(calls.at(-1)!.query.get('user')).toBe(username));
    expect(mine.attributes('aria-pressed')).toBe('true');
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
