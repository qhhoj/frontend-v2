import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { adminContestItem } from '@/test/admin-fixtures/index-search';

const PERMS = ['judge.edit_own_contest'];
const page = (items: unknown[], total = items.length) => ({
  body: { data: items, meta: { page: 1, pageSize: 20, total } },
});
const contestCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === '/contests');
const mountIndex = async (path = '/admin/contests') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('input[type="search"]').exists()).toBe(true));
  await flushPromises();
  return mounted;
};

describe('ContestSearchList', () => {
  it('switches the phase through the address and drops it for "Tất cả"', async () => {
    const calls = mockApi({ ...staffViewer(PERMS), 'GET /contests': page([adminContestItem()]) });
    const { wrapper, router } = await mountIndex('/admin/contests?q=hcmus&page=2');
    await wrapper.get('a[href$="phase=ended"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ q: 'hcmus', phase: 'ended' });
    expect(contestCalls(calls).at(-1)!.query.get('phase')).toBe('ended');
    await wrapper.get('a[href="/admin/contests?q=hcmus"]').trigger('click');
    await flushPromises();
    expect(contestCalls(calls).at(-1)!.query.has('phase')).toBe(false);
  });
});
