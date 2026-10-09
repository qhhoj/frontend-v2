import { describe, expect, it, vi } from 'vitest';
import { balloon } from '@/test/contest-extras-fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

describe('balloon print sheet', () => {
  it('asks the next ten pending balloons, numbers them, and prints on demand', async () => {
    const items = Array.from({ length: 10 }, (_unused, index) => balloon(index));
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/r42/balloons': page(items),
    });
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const { wrapper } = await mountApp('/contests/r42/balloons/print');
    const call = calls.find((seen) => seen.path === '/contests/r42/balloons')!;
    expect(Object.fromEntries(call.query)).toEqual({ state: 'pending', page: '1', pageSize: '10' });
    expect(wrapper.findAll('[data-testid="print-row"]')).toHaveLength(10);
    expect(wrapper.find('header nav').exists()).toBe(false);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'In')!
      .trigger('click');
    expect(print).toHaveBeenCalledOnce();
  });
});
