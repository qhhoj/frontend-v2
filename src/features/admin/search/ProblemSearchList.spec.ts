import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import { fail, mockApi } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { adminProblemItem } from '@/test/admin-fixtures/index-search';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

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

  it('keeps open-by-key beside the list and opens the editor on the exact code', async () => {
    mockApi({
      ...staffViewer(PERMS),
      ...problemEditorRoutes(editableProblem({ code: 'hcmus41c' })),
      'GET /problems': page([]),
    });
    const { wrapper, router } = await mountIndex();
    await wrapper.get('input:not([type="search"])').setValue('hcmus41c');
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/general'),
    );
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

  it('asks for the page in the address', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /problems': page([adminProblemItem()], 86, 3),
    });
    await mountIndex('/admin/problems?page=3');
    expect(problemCalls(calls)[0]!.query.get('page')).toBe('3');
  });

  it('says nothing matched, repeats the text and points at open-by-key', async () => {
    mockApi({ ...staffViewer(PERMS), 'GET /problems': page([]) });
    const { wrapper } = await mountIndex('/admin/problems?q=zzzz');
    expect(wrapper.text()).toContain('Không có bài nào khớp “zzzz”');
    expect(wrapper.text()).toContain('phần ngắn hơn');
  });

  it('shows a failed list with a retry that asks again', async () => {
    const calls = mockApi({ ...staffViewer(PERMS), 'GET /problems': fail(500, 'internal_error') });
    const { wrapper } = await mountIndex();
    expect(wrapper.get('[role="alert"]').text()).toContain('Đã có lỗi xảy ra.');
    const before = problemCalls(calls).length;
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(problemCalls(calls).length).toBe(before + 1);
  });

  it('marks a private problem', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /problems': page([adminProblemItem({ isPublic: false })]),
    });
    const { wrapper } = await mountIndex();
    expect(wrapper.text()).toContain('Riêng tư');
  });
});
