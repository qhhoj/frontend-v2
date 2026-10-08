import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SubmissionPager from './SubmissionPager.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));
const mountPager = (props: Record<string, unknown>) =>
  mountComponent(SubmissionPager, { props: { pageSize: 50, itemCount: 50, ...props } });

describe('the submission pager', () => {
  it('is hidden when everything fits one page', () => {
    expect(mountPager({ page: 1, total: 30, itemCount: 30 }).find('nav').exists()).toBe(false);
  });

  it('shows the position and asks for the neighbour page', async () => {
    const wrapper = mountPager({ page: 2, total: 120 });
    expect(wrapper.text()).toContain('Trang 2 / 3');
    await wrapper.get('button[data-direction="next"]').trigger('click');
    await wrapper.get('button[data-direction="previous"]').trigger('click');
    expect(wrapper.emitted('update:page')).toEqual([[3], [1]]);
  });

  it('does not move past either end and says so with aria-disabled', async () => {
    const first = mountPager({ page: 1, total: 120 });
    await first.get('button[data-direction="previous"]').trigger('click');
    expect(first.get('button[data-direction="previous"]').attributes('aria-disabled')).toBe('true');
    expect(first.emitted('update:page')).toBeUndefined();
    const last = mountPager({ page: 3, total: 120, itemCount: 20 });
    await last.get('button[data-direction="next"]').trigger('click');
    expect(last.emitted('update:page')).toBeUndefined();
  });

  it('without a total offers Next only while a full page came back', () => {
    const full = mountPager({ page: 2, total: undefined });
    expect(full.text()).toContain('Trang 2');
    expect(full.text()).not.toContain('/');
    expect(full.get('button[data-direction="next"]').attributes('aria-disabled')).toBeUndefined();
    const partial = mountPager({ page: 2, total: undefined, itemCount: 7 });
    expect(partial.get('button[data-direction="next"]').attributes('aria-disabled')).toBe('true');
  });
});
