import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { adminProblemItem } from '@/test/admin-fixtures/index-search';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';

const PERMS = ['judge.edit_own_problem'];
/** AdminFilterBar applies the search text this long after typing stops. */
const SEARCH_DELAY_MS = 250;
const page = (items: unknown[], total = items.length, current = 1) => ({
  body: { data: items, meta: { page: current, pageSize: 20, total } },
});
const META = { 'GET /problems/meta': { body: { data: problemEditingMeta() } } };
const problemCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === '/problems');
const mountIndex = async (path = '/admin/problems') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('input[type="search"]').exists()).toBe(true));
  await flushPromises();
  return mounted;
};

afterEach(() => vi.useRealTimers());

describe('ProblemSearchList', () => {
  it('lists problems the account may see (visibility=all), marks the typed text and links to the editor', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      ...META,
      'GET /problems': page([adminProblemItem()], 86),
      'GET /problems/hcmus': { status: 404, body: { error: { code: 'not_found', message: '' } } },
    });
    const { wrapper } = await mountIndex('/admin/problems?q=hcmus');
    const query = Object.fromEntries(problemCalls(calls)[0]!.query);
    expect(query).toMatchObject({ visibility: 'all', q: 'hcmus', page: '1', pageSize: '20' });
    expect(wrapper.get('mark').text().toLowerCase()).toBe('hcmus');
    expect(wrapper.get('a[href="/admin/problems/hcmus41c/general"]').text()).toContain('Cây khung');
    expect(wrapper.text()).toContain('86 bài');
    expect(wrapper.text()).not.toContain('Mở hcmus');
  });

  it('offers to open a typed code when a listed row has it, or when the editor knows it', async () => {
    mockApi({
      ...staffViewer(PERMS),
      ...META,
      'GET /problems': page([adminProblemItem({ code: 'hcmus41c' })]),
      'GET /problems/hcmus41a': { body: { data: { code: 'hcmus41a' } } },
    });
    const listed = await mountIndex('/admin/problems?q=HCMUS41C');
    expect(listed.wrapper.find('a[href="/admin/problems/hcmus41c/general"]').text()).toContain(
      'Mở hcmus41c',
    );
    listed.wrapper.unmount();
    const known = await mountIndex('/admin/problems?q=hcmus41a');
    await vi.waitFor(() => expect(known.wrapper.text()).toContain('Mở hcmus41a'));
  });

  it('sorts by a column header through the address', async () => {
    mockApi({ ...staffViewer(PERMS), ...META, 'GET /problems': page([adminProblemItem()]) });
    const { wrapper, router } = await mountIndex();
    const points = wrapper.findAll('th button').find((button) => button.text() === 'Điểm')!;
    await points.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ sort: '-points' });
    expect(wrapper.get('th[aria-sort="descending"]').text()).toBe('Điểm');
  });

  it('puts what was typed in the address after the pause and asks again with it', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      ...META,
      'GET /problems': page([adminProblemItem()]),
    });
    const { wrapper, router } = await mountIndex();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await wrapper.get('input[type="search"]').setValue('cây');
    await vi.advanceTimersByTimeAsync(SEARCH_DELAY_MS);
    vi.useRealTimers();
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ q: 'cây' });
    expect(problemCalls(calls).at(-1)!.query.get('q')).toBe('cây');
    expect(problemCalls(calls).at(-1)!.query.has('search')).toBe(false);
  });
});
