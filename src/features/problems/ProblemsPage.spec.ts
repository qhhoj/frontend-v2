import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  problemItem,
  problemMeta,
  profile,
  signedIn,
  signedOut,
  TYPE_DP_ID,
  userPage,
} from '@/test/fixtures';
import { fail, mockApi, ok, page } from '@/test/mock-api';
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

describe('problem list', () => {
  afterEach(() => vi.useRealTimers());

  it("lists problems with topics, numbers and the viewer's status", async () => {
    const calls = mockApi({
      ...anonymous(),
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'GET /users/user_01': ok(userPage()),
    });
    const { wrapper } = await mountApp('/problems');
    expect(wrapper.get('h1').text()).toBe('Chọn bài, bắt đầu giải');
    expect(wrapper.text()).toContain('2.318 bài · bạn đã giải 412');
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.text()).toContain('Dãy con tăng dài nhất');
    expect(rows[0]!.text()).toContain('lis');
    expect(rows[0]!.text()).toContain('Quy hoạch động');
    expect(rows[0]!.text()).toContain('55,2%');
    expect(rows[0]!.text()).toContain('2.011');
    expect(rows[0]!.text()).toContain('1400');
    expect(rows[1]!.text()).toContain('2200');
    expect(rows[0]!.text()).toContain('Đã giải');
    expect(rows[2]!.text()).toContain('Đã thử');
    expect(rows[1]!.find('a[href="/problems/knapsack2"]').exists()).toBe(true);
    const query = lastListQuery(calls);
    expect([query.get('lang'), query.get('page'), query.get('pageSize')]).toEqual([
      'vi',
      '1',
      '50',
    ]);
  });

  it('asks for statements in the interface language', async () => {
    const calls = mockApi(anonymous());
    const { wrapper } = await mountApp('/problems');
    await wrapper.get('button[aria-label="Switch to English"]').trigger('click');
    await flushPromises();
    expect(lastListQuery(calls).get('lang')).toBe('en');
  });

  it('shows the total alone to anonymous viewers', async () => {
    mockApi(anonymous(page(threeProblems)));
    const { wrapper } = await mountApp('/problems');
    expect(wrapper.text()).toContain('3 bài');
    expect(wrapper.text()).not.toContain('bạn đã giải');
  });

  it('toggles a topic filter through the URL', async () => {
    const calls = mockApi(anonymous());
    const { wrapper, router } = await mountApp('/problems');
    const chip = () => wrapper.get('[role="group"] button[aria-pressed]');
    await chip().trigger('click');
    await flushPromises();
    expect([router.currentRoute.value.query.type].flat()).toEqual([TYPE_DP_ID]);
    expect(lastListQuery(calls).getAll('typeIds')).toEqual([TYPE_DP_ID]);
    expect(chip().attributes('aria-pressed')).toBe('true');
    await chip().trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.type).toBeUndefined();
  });

  it('searches once typing pauses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi(anonymous());
    const { wrapper, router } = await mountApp('/problems');
    await wrapper.get('input[type="search"]').setValue('lis');
    expect(router.currentRoute.value.query.search).toBeUndefined();
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
    expect(router.currentRoute.value.query.search).toBe('lis');
    expect(lastListQuery(calls).get('search')).toBe('lis');
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

  it('moves focus into the points popover from the keyboard', async () => {
    mockApi(anonymous());
    const { wrapper } = await mountApp('/problems');
    const trigger = wrapper.get('#main button[aria-haspopup="dialog"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    await trigger.trigger('keydown.enter');
    await trigger.trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(document.body.querySelector('input[name="pointsMin"]'));
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(document.body.querySelector('[role="dialog"]')!.getAttribute('aria-label')).toBe(
      'Lọc theo điểm',
    );
  });

  it('keeps the loaded rows when loading more fails', async () => {
    mockApi(
      anonymous(({ query }) =>
        query.get('page') === '2'
          ? fail(500, 'internal')
          : page(threeProblems.slice(0, 2), { pageSize: 2, total: 3 }),
      ),
    );
    const { wrapper } = await mountApp('/problems');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tải thêm bài')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('ignores filters the API would refuse', async () => {
    const calls = mockApi(anonymous());
    await mountApp('/problems?min=abc&type=nope&sort=bogus&max=3500');
    const query = lastListQuery(calls);
    expect([
      query.get('pointsMin'),
      query.getAll('typeIds'),
      query.get('sort'),
      query.get('pointsMax'),
    ]).toEqual([null, [], null, '3500']);
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

  it('loads more pages until every problem is shown', async () => {
    const calls = mockApi(
      anonymous(({ query }) =>
        query.get('page') === '2'
          ? page([threeProblems[2]], { page: 2, pageSize: 2, total: 3 })
          : page(threeProblems.slice(0, 2), { pageSize: 2, total: 3 }),
      ),
    );
    const { wrapper } = await mountApp('/problems');
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tải thêm bài')!
      .trigger('click');
    await flushPromises();
    expect(lastListQuery(calls).get('page')).toBe('2');
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tải thêm bài')).toBe(
      false,
    );
  });

  it('sets a points range from the popover', async () => {
    mockApi(anonymous());
    const { wrapper, router } = await mountApp('/problems');
    await wrapper.get('#main button[aria-haspopup="dialog"]').trigger('click');
    await flushPromises();
    const minimum = document.body.querySelector<HTMLInputElement>('input[name="pointsMin"]')!;
    minimum.value = '800';
    minimum.dispatchEvent(new Event('change'));
    await flushPromises();
    expect(router.currentRoute.value.query.min).toBe('800');
    expect(wrapper.get('#main button[aria-haspopup="dialog"]').text()).toBe('Điểm 800–…');
  });

  it('says when nothing matches', async () => {
    mockApi(anonymous(page([])));
    const { wrapper } = await mountApp('/problems?search=zzz');
    expect(wrapper.text()).toContain('Không có bài phù hợp.');
  });
});
