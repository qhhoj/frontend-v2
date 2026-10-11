import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountComponent } from '@/test/mount';
import AdminDataTable from './AdminDataTable.vue';
import type { AdminColumn } from './table-columns';

interface Item {
  code: string;
  points: number;
}
const ROWS: Item[] = [
  { code: 'a', points: 1 },
  { code: 'b', points: 2 },
];
const COLUMNS: AdminColumn[] = [
  { key: 'code', label: 'Bài', priority: 'primary', sort: { asc: 'code', desc: '-code' } },
  { key: 'points', label: 'Điểm', align: 'end' },
];

const Host = defineComponent(() => {
  const selected = ref(new Set<string>());
  const sort = ref<string | undefined>('newest');
  return () =>
    h('div', [
      h('output', { 'data-sort': sort.value }),
      h(
        AdminDataTable<Item>,
        {
          columns: COLUMNS,
          rows: ROWS,
          rowKey: (row: Item) => row.code,
          rowAttrs: (row: Item) => ({ 'data-code': row.code }),
          label: 'Bài tập',
          selectable: true,
          selected: selected.value,
          'onUpdate:selected': (next: Set<string>) => (selected.value = next),
          sort: sort.value,
          'onUpdate:sort': (next: string | undefined) => (sort.value = next),
        },
        { bulk: () => h('button', { type: 'button' }, 'Ẩn') },
      ),
    ]);
});

describe('AdminDataTable', () => {
  it('shows the bulk bar only while rows are picked, and "select page" picks every shown row', async () => {
    const wrapper = mountComponent(Host);
    expect(wrapper.text()).not.toContain('đã chọn');
    await wrapper.get('tr[data-code="a"] input[type="checkbox"]').setValue(true);
    expect(wrapper.text()).toContain('1 đã chọn');
    const pageBox = wrapper.get('thead input[type="checkbox"]').element as HTMLInputElement;
    expect(pageBox.indeterminate).toBe(true);
    await wrapper.get('thead input[type="checkbox"]').trigger('change');
    expect(wrapper.text()).toContain('2 đã chọn');
    await wrapper.get('[role="group"] button').trigger('click');
    expect(wrapper.text()).not.toContain('đã chọn');
  });

  it('sorts from a header button and marks the sorted column', async () => {
    const wrapper = mountComponent(Host);
    await wrapper.get('th button').trigger('click');
    expect(wrapper.get('output').attributes('data-sort')).toBe('code');
    expect(wrapper.findAll('th')[1]!.attributes('aria-sort')).toBe('ascending');
    await wrapper.get('th button').trigger('click');
    expect(wrapper.get('output').attributes('data-sort')).toBe('-code');
  });
});
