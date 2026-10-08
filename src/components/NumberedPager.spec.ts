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
  it('renders nothing when everything fits on one page', async () => {
    const wrapper = await mountPager({}, { page: 1, pageSize: 10, total: 4 });
    expect(wrapper.find('nav').exists()).toBe(false);
  });
  it('writes the page into the query key it is given', async () => {
    const wrapper = await mountPager({ p: '2' }, { page: 2, pageSize: 10, total: 30 }, 'p');
    expect(wrapper.get('a[aria-label="Trang sau"]').attributes('href')).toBe('/users?p=3');
    expect(wrapper.get('a[aria-label="Trang trước"]').attributes('href')).toBe('/users');
  });
  it('shows a disabled arrow as an unlinked, named link in muted token colours, never faded', async () => {
    const first = await mountPager({}, { page: 1, pageSize: 10, total: 30 });
    const previous = first.get('[aria-label="Trang trước"]');
    expect(previous.element.tagName).toBe('SPAN');
    expect(previous.attributes('role')).toBe('link');
    expect(previous.attributes('aria-disabled')).toBe('true');
    expect(previous.attributes('href')).toBeUndefined();
    expect(previous.classes()).toContain('aria-disabled:text-muted');
    expect(previous.classes().some((name) => name.includes('opacity'))).toBe(false);
    const last = await mountPager({ page: '3' }, { page: 3, pageSize: 10, total: 30 });
    expect(last.get('[aria-label="Trang sau"]').attributes('aria-disabled')).toBe('true');
  });
});
