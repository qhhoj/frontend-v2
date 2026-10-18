import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { COMPACT_LIST_QUERY } from '@/lib/use-media-query';
import { stubMatchMedia } from '@/test/match-media';
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
  afterEach(() => vi.unstubAllGlobals());

  it('shapes the loading skeleton from the columns, header row included', () => {
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, loading: true, skeletonRows: 3 },
    });
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(wrapper.findAll('thead th')).toHaveLength(COLUMNS.length);
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

  it('opens a rowTo row in a new tab on Ctrl-click or middle click, never at the end of a text selection', async () => {
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, rowTo: (row: Item) => `/problem/${row.code}` },
    });
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const row = wrapper.findAll('tbody tr')[1]!;
    await row.findAll('td')[1]!.trigger('click', { ctrlKey: true });
    await row.trigger('auxclick', { button: 1 });
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith('/problem/b', '_blank', 'noopener');
    expect(push).not.toHaveBeenCalled();
    const selection = vi
      .spyOn(window, 'getSelection')
      .mockReturnValue({ toString: () => 'ab' } as Selection);
    await row.findAll('td')[1]!.trigger('click');
    expect(push).not.toHaveBeenCalled();
    selection.mockRestore();
    open.mockRestore();
  });

  it('cycles a clearing sort through both directions and back to none', async () => {
    const columns: DataTableColumn[] = [
      {
        key: 'points',
        label: 'Điểm',
        sort: { asc: 'points', desc: '-points', first: 'desc', clears: true },
      },
    ];
    /** The value the sort model takes when the header is clicked while the list is sorted by `current`. */
    const clickFrom = async (current: string | undefined) => {
      const changes: Array<string | undefined> = [];
      const wrapper = mountComponent(DataTable, {
        props: {
          ...BASE,
          columns,
          sort: current,
          'onUpdate:sort': (value: string | undefined) => changes.push(value),
        },
      });
      await wrapper.get('th button').trigger('click');
      return changes;
    };
    expect(await clickFrom(undefined)).toEqual(['-points']);
    expect(await clickFrom('-points')).toEqual(['points']);
    expect(await clickFrom('points')).toEqual([undefined]);
  });

  it('draws a stacked row with the page’s own card slot when the table is narrow', () => {
    stubMatchMedia().setQuery(COMPACT_LIST_QUERY, true);
    const wrapper = mountComponent(DataTable, {
      props: { ...BASE, stackBelow: 640 },
      slots: {
        card: ({ row }: { row: Item }) => h('li', { 'data-own-card': row.code }, row.code),
      } as unknown as Record<string, string>,
    });
    expect(wrapper.findAll('[data-own-card]').map((card) => card.text())).toEqual(['a', 'b']);
    expect(wrapper.find('table').exists()).toBe(false);
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

  describe('as cards on a narrow screen', () => {
    const CARD_COLUMNS: DataTableColumn[] = [
      ...COLUMNS,
      { key: 'note', label: 'Ghi chú', priority: 'meta' },
    ];
    const mountCards = () => {
      stubMatchMedia().setQuery(COMPACT_LIST_QUERY, true);
      return mountComponent(DataTable, {
        props: {
          ...BASE,
          columns: CARD_COLUMNS,
          rows: ROWS.map((row) => ({ ...row, note: `ghi chú ${row.code}` })),
          selectable: true,
        },
      });
    };

    it('opens a row\'s meta columns from its "Chi tiết" button, one row at a time', async () => {
      const wrapper = mountCards();
      const [first, second] = wrapper.findAll('li button[aria-expanded]');
      const detailsOf = (toggle: typeof first) =>
        wrapper.get(`#${toggle!.attributes('aria-controls')}`);
      expect(detailsOf(first).isVisible()).toBe(false);
      await first!.trigger('click');
      expect(first!.attributes('aria-expanded')).toBe('true');
      expect(detailsOf(first).isVisible()).toBe(true);
      expect(detailsOf(first).text()).toContain('ghi chú a');
      expect(detailsOf(second).isVisible()).toBe(false);
    });

    it('selects a card from its checkbox', async () => {
      const wrapper = mountCards();
      await wrapper.get('li input[type="checkbox"]').setValue(true);
      expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([new Set(['a'])]);
    });
  });
});
