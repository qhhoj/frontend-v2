import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  problemDetail,
  problemItem,
  problemMeta,
  profile,
  signedIn,
  signedOut,
  userPage,
} from '@/test/fixtures';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { commentPageRoute } from '@/test/community-routes';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const threeProblems = [
  problemItem({ viewerStatus: 'solved' }),
  problemItem({
    id: '0192a000-0000-7000-8000-0000000002a2',
    code: 'knapsack2',
    name: 'Cái túi 2',
    points: 2200,
    acRate: 27.4,
    userCount: 498,
  }),
  problemItem({
    id: '0192a000-0000-7000-8000-0000000002a3',
    code: 'dpbitree',
    name: 'Quy hoạch trên cây',
    viewerStatus: 'attempted',
  }),
];
const anonymous = (list: MockHandler = page(threeProblems, { total: 2318 })) => ({
  'GET /auth/me': signedOut,
  'GET /problems/meta': ok(problemMeta()),
  'GET /problems': list,
});
const lastListQuery = (calls: { path: string; query: URLSearchParams }[]) =>
  calls.filter((call) => call.path === '/problems').at(-1)!.query;

const scrollIntoView = vi.fn();

describe('problem list', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => vi.useRealTimers());

  it('toggles solved and editorial filters, clears all, and the back button undoes a change', async () => {
    const calls = mockApi({
      ...anonymous(),
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'GET /users/user_01': ok(userPage()),
    });
    const { wrapper, router } = await mountApp('/problems');
    const toggle = (name: string) =>
      wrapper.findAll('#main button[aria-pressed]').find((button) => button.text() === name)!;
    await toggle('Ẩn bài đã giải').trigger('click');
    await flushPromises();
    await toggle('Có lời giải').trigger('click');
    await flushPromises();
    const query = lastListQuery(calls);
    expect([query.get('solved'), query.get('hasEditorial')]).toEqual(['false', 'true']);
    expect(toggle('Ẩn bài đã giải').attributes('aria-pressed')).toBe('true');
    router.back();
    await flushPromises();
    expect(toggle('Có lời giải').attributes('aria-pressed')).toBe('false');
    expect(toggle('Ẩn bài đã giải').attributes('aria-pressed')).toBe('true');
    await toggle('Có lời giải').trigger('click');
    await flushPromises();
    const clearAll = wrapper.findAll('button').find((button) => button.text() === 'Xóa tất cả')!;
    await clearAll.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({});
  });

  it('opens a random problem under the current filters', async () => {
    const calls = mockApi({
      ...anonymous(),
      'GET /problems/random': ok({ code: 'lucky' }),
      'GET /problems/lucky': ok(problemDetail({ code: 'lucky' })),
      ...commentPageRoute('problem', 'lucky'),
    });
    const { wrapper, router } = await mountApp('/problems?min=800&editorial=1');
    await wrapper
      .findAll('#main button')
      .find((button) => button.text() === 'Bài ngẫu nhiên')!
      .trigger('click');
    await flushPromises();
    const asked = calls.find((call) => call.path === '/problems/random')!;
    expect([asked.query.get('pointsMin'), asked.query.get('hasEditorial')]).toEqual([
      '800',
      'true',
    ]);
    expect(asked.query.has('page')).toBe(false);
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/problems/lucky'));
  });

  it('says so when no problem matches the random pick', async () => {
    mockApi({ ...anonymous(), 'GET /problems/random': fail(404, 'no_problem') });
    const { wrapper, router } = await mountApp('/problems');
    await wrapper
      .findAll('#main button')
      .find((button) => button.text() === 'Bài ngẫu nhiên')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="random-status"]').text()).toBe('Không có bài phù hợp.');
    expect(router.currentRoute.value.name).toBe('problems');
  });

  it('sends one request for two quick keystrokes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi(anonymous());
    const { wrapper } = await mountApp('/problems');
    const input = wrapper.get('input[type="search"]');
    await input.setValue('l');
    await vi.advanceTimersByTimeAsync(100);
    await input.setValue('lis');
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
    const searched = calls.filter((call) => call.path === '/problems' && call.query.has('search'));
    expect(searched.map((call) => call.query.get('search'))).toEqual(['lis']);
  });

  it('keeps the shown page and offers a retry when the next page fails', async () => {
    mockApi(
      anonymous(({ query }) =>
        query.get('page') === '2'
          ? fail(500, 'internal')
          : page(threeProblems.slice(0, 2), { pageSize: 2, total: 3 }),
      ),
    );
    const { wrapper } = await mountApp('/problems');
    await wrapper
      .get('nav[aria-label="Các trang bài tập"] a[aria-label="Trang sau"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('sorts by a column, highest first, then lowest first', async () => {
    const calls = mockApi(anonymous());
    const { wrapper, router } = await mountApp('/problems');
    const header = () => wrapper.findAll('th').find((cell) => cell.text().startsWith('Điểm'))!;
    const sortButton = () => header().get('button');
    sortButton().element.focus();
    await sortButton().trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(sortButton().element);
    expect(router.currentRoute.value.query.sort).toBe('-points');
    expect(header().attributes('aria-sort')).toBe('descending');
    await header().get('button').trigger('click');
    await flushPromises();
    expect(lastListQuery(calls).get('sort')).toBe('points');
    expect(header().attributes('aria-sort')).toBe('ascending');
  });

  const twoPages = () =>
    mockApi(
      anonymous(({ query }) =>
        query.get('page') === '2'
          ? page([threeProblems[2]], { page: 2, pageSize: 2, total: 3 })
          : page(threeProblems.slice(0, 2), { pageSize: 2, total: 3 }),
      ),
    );

  it('shows one numbered page at a time and resumes the page from the URL', async () => {
    const calls = twoPages();
    const { wrapper, router } = await mountApp('/problems');
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.get('nav[aria-label="Các trang bài tập"] [aria-current="page"]').text()).toBe(
      '1',
    );
    await wrapper
      .get('nav[aria-label="Các trang bài tập"] a[aria-label="Trang sau"]')
      .trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('2');
    expect(lastListQuery(calls).get('page')).toBe('2');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.get('nav[aria-label="Các trang bài tập"] [aria-current="page"]').text()).toBe(
      '2',
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    const reloaded = await mountApp('/problems?page=2');
    expect(reloaded.wrapper.findAll('tbody tr')).toHaveLength(1);
  });

  it('goes back to page 1 when a filter or the sort changes', async () => {
    twoPages();
    const { wrapper, router } = await mountApp('/problems?page=2&min=800');
    await wrapper.get('th button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBeUndefined();
    expect(router.currentRoute.value.query.min).toBe('800');
  });

  it.each(['999', 'abc', '0', '1'])(
    'replaces an unusable or out-of-range ?page=%s with a valid page',
    async (raw) => {
      twoPages();
      const { wrapper, router } = await mountApp(`/problems?sort=points&page=${raw}`);
      await flushPromises();
      const expected = raw === '999' ? '2' : undefined;
      expect(router.currentRoute.value.query.page).toBe(expected);
      expect(router.currentRoute.value.query.sort).toBe('points');
      expect(wrapper.find('tbody tr').exists()).toBe(true);
    },
  );

  it('shows no status marks to anonymous viewers', async () => {
    mockApi(anonymous());
    const { wrapper } = await mountApp('/problems');
    expect(wrapper.findAll('tbody svg[role="img"]')).toHaveLength(0);
  });

  it('opens a problem from a click anywhere in its row, but not at the end of a text selection', async () => {
    mockApi({
      ...anonymous(),
      'GET /problems/knapsack2': ok(problemDetail({ code: 'knapsack2' })),
      ...commentPageRoute('problem', 'knapsack2'),
    });
    const { wrapper, router } = await mountApp('/problems');
    const typesCell = wrapper.findAll('tbody tr')[1]!.findAll('td')[2]!;
    const selection = vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'Quy hoạch',
    } as Selection);
    await typesCell.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('problems');
    selection.mockReturnValue({ toString: () => '' } as Selection);
    await typesCell.trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/problems/knapsack2'));
    selection.mockRestore();
  });

  it('swaps a minimum above the maximum and forgets the random message on the next filter', async () => {
    mockApi({ ...anonymous(), 'GET /problems/random': fail(404, 'no_problem') });
    const { wrapper, router } = await mountApp('/problems?max=1000');
    await wrapper
      .findAll('#main button')
      .find((button) => button.text() === 'Bài ngẫu nhiên')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="random-status"]').text()).not.toBe('');
    await wrapper.get('#main button[aria-label^="Lọc theo điểm"]').trigger('click');
    await flushPromises();
    const minimum = document.body.querySelector<HTMLInputElement>('input[name="pointsMin"]')!;
    minimum.value = '2000';
    minimum.dispatchEvent(new Event('change'));
    await flushPromises();
    expect([router.currentRoute.value.query.min, router.currentRoute.value.query.max]).toEqual([
      '1000',
      '2000',
    ]);
    expect(wrapper.get('[data-testid="random-status"]').text()).toBe('');
  });
});
