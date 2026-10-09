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
  it('lists contests with the phase and the typed text, marks hits in name and key, links to the editor', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /contests': page([adminContestItem()], 86),
    });
    const { wrapper } = await mountIndex('/admin/contests?q=hcmus&phase=running');
    expect(Object.fromEntries(contestCalls(calls)[0]!.query)).toMatchObject({
      q: 'hcmus',
      phase: 'running',
      page: '1',
      pageSize: '20',
    });
    expect(wrapper.findAll('mark').length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find('a[href="/admin/contests/hcmus-2026-r1/general"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Đang diễn ra');
    expect(wrapper.text()).toContain('1 / 86 kỳ thi khớp “hcmus”');
  });

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

  it('says which filter matched nothing', async () => {
    mockApi({ ...staffViewer(PERMS), 'GET /contests': page([]) });
    const { wrapper } = await mountIndex('/admin/contests?q=olympic');
    expect(wrapper.text()).toContain('Không có kỳ thi nào khớp “olympic”');
    expect(wrapper.text()).toContain('Tất cả');
  });

  it('marks the active phase for assistive technology', async () => {
    mockApi({ ...staffViewer(PERMS), 'GET /contests': page([adminContestItem()]) });
    const { wrapper } = await mountIndex('/admin/contests?phase=upcoming');
    const current = wrapper.findAll('nav[aria-label="Giai đoạn"] [aria-current="true"]');
    expect(current.map((link) => link.text())).toEqual(['Sắp diễn ra']);
  });
});
