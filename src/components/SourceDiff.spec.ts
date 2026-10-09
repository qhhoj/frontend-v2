import { describe, expect, it } from 'vitest';
import { lineDiff } from '@/lib/line-diff';
import { mountComponent } from '@/test/mount';
import SourceDiff from './SourceDiff.vue';
import SourceDiffSkeleton from './SourceDiffSkeleton.vue';

const lines = (count: number, prefix: string) =>
  Array.from({ length: count }, (_unused, index) => `${prefix} ${index + 1}`).join('\n');
const wide = (wrapper: ReturnType<typeof mountDiff>) =>
  wrapper.get('[data-testid="diff-table-wide"]');
const narrow = (wrapper: ReturnType<typeof mountDiff>) =>
  wrapper.get('[data-testid="diff-table-narrow"]');
const mountDiff = (left: string, right: string) =>
  mountComponent(SourceDiff, { props: { rows: lineDiff(left, right) } });

describe('SourceDiff', () => {
  it('summarises added, removed and identical lines', () => {
    const wrapper = mountDiff('a\nb\nc', 'a\nB\nc\nd');
    const pills = wrapper.get('[data-testid="diff-summary"]').findAll('li');
    expect(pills.map((item) => item.get('[data-full]').text())).toEqual([
      '+2 dòng',
      '−1 dòng',
      '2 dòng giống nhau',
    ]);
  });

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

  it('labels moved and whitespace-only rows in words, not only colour', () => {
    expect(wide(mountDiff('a\nb\nc', 'b\nc\na')).findAll('[data-moved]')).toHaveLength(2);
    expect(mountDiff('a\nb\nc', 'b\nc\na').text()).toContain('Đã chuyển chỗ');
    expect(mountDiff('int x;', 'int  x;').text()).toContain('Chỉ khác khoảng trắng');
  });

  it('keeps line numbers of each side', () => {
    const wrapper = mountDiff('a\nc', 'a\nb\nc');
    const added = wide(wrapper).get('tr[data-kind="added"]');
    expect(added.get('[data-cell="right-number"]').text()).toBe('2');
    expect(added.get('[data-cell="left-number"]').text()).toBe('');
  });

  it('puts the table in a focusable, labelled region that scrolls on its own', () => {
    const region = mountDiff('a', 'b').get('[role="region"]');
    expect(region.attributes('tabindex')).toBe('0');
    expect(region.attributes('aria-label')).toBe('Mã nguồn hai bài, cạnh nhau');
    expect(region.classes()).toContain('overflow-x-auto');
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

  it('numbers old and new lines apart and keeps the folded-run button', () => {
    const table = narrow(mountDiff(`${lines(10, 'top')}\nold`, `${lines(10, 'top')}\nnew`));
    expect(table.get('[data-testid="diff-fold"]').text()).toBe('Hiện 8 dòng giống nhau đã gập');
    const removed = table.get('tr[data-kind="removed"]');
    expect(
      removed
        .findAll('td')
        .slice(0, 2)
        .map((cell) => cell.text()),
    ).toEqual(['11', '']);
  });
});

describe('SourceDiffSkeleton', () => {
  it('mirrors the summary row and the code lines, inert', () => {
    const wrapper = mountComponent(SourceDiffSkeleton);
    expect(wrapper.findAll('[data-skeleton-region="diff-summary"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-skeleton-region="diff-line"]').length).toBeGreaterThan(5);
    expect(wrapper.text()).toBe('');
    expect(wrapper.findAll('button, a, [tabindex]')).toHaveLength(0);
  });
});
