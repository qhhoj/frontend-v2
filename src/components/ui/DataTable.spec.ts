import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { mountComponent } from '@/test/mount';
import DataTable from './DataTable.vue';
import type { DataTableColumn } from './DataTableColumns';

interface Item {
  code: string;
  points: number;
}
const ROWS: Item[] = [
  { code: 'a', points: 1 },
  { code: 'b', points: 2 },
];
const COLUMNS: DataTableColumn[] = [
  { key: 'code', label: 'Bài', priority: 'primary' },
  { key: 'points', label: 'Điểm', align: 'end' },
];
const BASE = { columns: COLUMNS, rows: ROWS, rowKey: (row: Item) => row.code, label: 'Bài tập' };

describe('DataTable', () => {
  it('shapes the loading skeleton from the columns', () => {
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, loading: true, skeletonRows: 3 },
    });
    const rows = wrapper.findAll('tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.findAll('td')).toHaveLength(COLUMNS.length);
    expect(rows[0]!.findAll('td')[1]!.classes()).toContain('text-right');
  });

  it('opens a rowTo row from a click anywhere on it, and links its primary cell', async () => {
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, rowTo: (row: Item) => `/problem/${row.code}` },
    });
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined);
    expect(wrapper.get('tbody tr a').attributes('href')).toBe('/problem/a');
    await wrapper.findAll('tbody tr')[1]!.findAll('td')[1]!.trigger('click');
    expect(push).toHaveBeenCalledWith('/problem/b');
  });

  it('shows the page range and the pager when given a numbered page', () => {
    const wrapper = mountComponent(DataTable, {
      props: {
        ...BASE,
        pager: { meta: { page: 2, pageSize: 2, total: 7 }, label: 'Trang' },
      },
    });
    expect(wrapper.text()).toContain('3–4');
    expect(wrapper.get('nav[aria-label="Trang"]').find('[aria-current="page"]').text()).toBe('2');
  });

  it('pins the leading columns in scroll mode and leaves the rest free', () => {
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, stack: 'scroll', stickyColumns: 1 },
    });
    const [first, second] = wrapper.findAll('tbody tr')[0]!.findAll('td');
    expect(first!.classes()).toContain('sticky');
    expect(first!.attributes('style')).toContain('left: 0px');
    expect(second!.classes()).not.toContain('sticky');
  });

  it('keeps a footer slot in place of the built-in pager', () => {
    const wrapper = mountComponent(DataTable, {
      props: BASE,
      slots: { footer: () => h('span', 'Còn nữa') } as unknown as Record<string, string>,
    });
    expect(wrapper.text()).toContain('Còn nữa');
  });
});
