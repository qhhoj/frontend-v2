import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import { mockApi } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { adminProblemItem } from '@/test/admin-fixtures/index-search';

const PERMS = ['judge.edit_own_problem'];
const page = (items: unknown[], total = items.length, current = 1) => ({
  body: { data: items, meta: { page: current, pageSize: 20, total } },
});
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
      'GET /problems': page([adminProblemItem()], 86),
    });
    const { wrapper } = await mountIndex('/admin/problems?q=hcmus');
    const query = Object.fromEntries(problemCalls(calls)[0]!.query);
    expect(query).toMatchObject({ visibility: 'all', q: 'hcmus', page: '1', pageSize: '20' });
    expect(wrapper.get('mark').text().toLowerCase()).toBe('hcmus');
    expect(wrapper.get('a[href="/admin/problems/hcmus41c/general"]').text()).toContain('Cây khung');
    expect(wrapper.text()).toContain('1 / 86 bài khớp “hcmus”');
  });

  it('puts what was typed in the address after the pause and asks again with it', async () => {
    const calls = mockApi({ ...staffViewer(PERMS), 'GET /problems': page([adminProblemItem()]) });
    const { wrapper, router } = await mountIndex();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await wrapper.get('input[type="search"]').setValue('cây');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS);
    vi.useRealTimers();
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ q: 'cây' });
    expect(problemCalls(calls).at(-1)!.query.get('q')).toBe('cây');
    expect(problemCalls(calls).at(-1)!.query.has('search')).toBe(false);
  });
});
