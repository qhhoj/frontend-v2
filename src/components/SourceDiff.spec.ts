import { describe, expect, it } from 'vitest';
import { lineDiff } from '@/lib/line-diff';
import { mountComponent } from '@/test/mount';
import SourceDiff from './SourceDiff.vue';

const lines = (count: number, prefix: string) =>
  Array.from({ length: count }, (_unused, index) => `${prefix} ${index + 1}`).join('\n');
const wide = (wrapper: ReturnType<typeof mountDiff>) =>
  wrapper.get('[data-testid="diff-table-wide"]');
const narrow = (wrapper: ReturnType<typeof mountDiff>) =>
  wrapper.get('[data-testid="diff-table-narrow"]');
const mountDiff = (left: string, right: string) =>
  mountComponent(SourceDiff, { props: { rows: lineDiff(left, right)! } });

describe('SourceDiff', () => {
  it('draws a changed line on both sides and highlights only the changed word', () => {
    const wrapper = mountDiff('cout << a;', 'cout << b;');
    const row = wide(wrapper).get('tr[data-kind="changed"]');
    const highlighted = row.findAll('[data-word="changed"]').map((part) => part.text());
    expect(highlighted).toEqual(['a', 'b']);
    expect(row.text()).toContain('Xóa');
    expect(row.text()).toContain('Thêm');
  });

  it('folds a long identical run behind a button that opens it', async () => {
    const wrapper = mountDiff(`${lines(10, 'top')}\nold`, `${lines(10, 'top')}\nnew`);
    const fold = wrapper.get('[data-testid="diff-fold"]');
    expect(fold.text()).toBe('Hiện 8 dòng giống nhau đã gập');
    expect(wide(wrapper).findAll('tr[data-kind="same"]')).toHaveLength(2);
    await fold.trigger('click');
    expect(wrapper.find('[data-testid="diff-fold"]').exists()).toBe(false);
    expect(wide(wrapper).findAll('tr[data-kind="same"]')).toHaveLength(10);
  });
});

describe('SourceDiff on a phone', () => {
  it('splits a changed row into a removed line then an added line, in one column', () => {
    const table = narrow(mountDiff('a\nold\nc', 'a\nnew\nc'));
    expect(table.findAll('[data-kind="changed"]')).toHaveLength(0);
    expect(table.findAll('tr[data-kind]').map((row) => row.attributes('data-kind'))).toEqual([
      'same',
      'removed',
      'added',
      'same',
    ]);
    const added = table.get('tr[data-kind="added"]');
    expect(added.findAll('td').map((cell) => cell.text().slice(0, 3))[0]).toBe('');
    expect(added.text()).toContain('Thêm');
  });
});
