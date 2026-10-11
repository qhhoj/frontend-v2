import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import NumberedPager from './NumberedPager.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

const mountPager = async (query: Record<string, string>, meta: object, queryKey?: string) => {
  const wrapper = mountComponent(NumberedPager, {
    props: { meta, label: 'Trang bảng xếp hạng', queryKey },
  });
  await wrapper.vm.$router.push({ path: '/users', query });
  return wrapper;
};

describe('NumberedPager', () => {
  it('links every shown page, keeps the other filters and marks the current page', async () => {
    const wrapper = await mountPager(
      { sort: 'points', page: '12' },
      { page: 12, pageSize: 100, total: 4562 },
    );
    const nav = wrapper.get('nav');
    expect(nav.attributes('aria-label')).toBe('Trang bảng xếp hạng');
    const links = nav.findAll('a');
    expect(links.map((link) => link.text()).filter(Boolean)).toEqual(['1', '11', '12', '13', '46']);
    expect(nav.get('[aria-current="page"]').text()).toBe('12');
    expect(nav.get('a[aria-label="Trang sau"]').attributes('href')).toBe(
      '/users?sort=points&page=13',
    );
    expect(nav.get('a[aria-label="Trang trước"]').attributes('href')).toBe(
      '/users?sort=points&page=11',
    );
  });
  it('drops the page key for page 1 and disables the previous link there', async () => {
    const wrapper = await mountPager({ page: '2' }, { page: 2, pageSize: 10, total: 30 });
    expect(wrapper.get('a[aria-label="Trang trước"]').attributes('href')).toBe('/users');
    const first = await mountPager({}, { page: 1, pageSize: 10, total: 30 });
    expect(first.get('[aria-label="Trang trước"]').attributes('aria-disabled')).toBe('true');
  });
});
