import { describe, expect, it } from 'vitest';
import { canLoadOldValues, changeLinesOf, lineChanges, prefillOf } from './flatpage-history';

const BEFORE = '## QHHOJ\n- Hơn **1 000** bài tập\n- Kỳ thi hàng tuần';
const AFTER = '## QHHOJ\n- Hơn **1 200** bài tập\n- Kỳ thi hàng tuần';

describe('flatpage history', () => {
  it('lists only the lines that are on one side, in order, and ignores blank ones', () => {
    expect(lineChanges(BEFORE, AFTER)).toEqual({
      removed: ['- Hơn **1 000** bài tập'],
      added: ['- Hơn **1 200** bài tập'],
    });
    expect(lineChanges('a\n\nb', 'a\nb')).toEqual({ removed: [], added: [] });
    expect(lineChanges('x\nx', 'x')).toEqual({ removed: ['x'], added: [] });
  });

  it('shows a created page as only added lines', () => {
    expect(changeLinesOf({ content: { before: null, after: 'a\nb' } })).toEqual([
      { field: 'content', removed: [], added: ['a', 'b'], hidden: 0 },
    ]);
  });

  it('shows a short field as one removed and one added line, and a switch as words', () => {
    const lines = changeLinesOf({
      title: { before: 'Giới thiệu', after: 'Giới thiệu QHHOJ' },
      registrationRequired: { before: false, after: true },
    });
    expect(lines).toEqual([
      { field: 'title', removed: ['Giới thiệu'], added: ['Giới thiệu QHHOJ'], hidden: 0 },
      { field: 'registrationRequired', removed: ['không'], added: ['có'], hidden: 0 },
    ]);
  });

  it('caps a rewrite at 40 lines a side and counts the rest', () => {
    const before = Array.from({ length: 100 }, (_unused, index) => `old ${index}`).join('\n');
    const [line] = changeLinesOf({ content: { before, after: 'new' } });
    expect(line!.removed).toHaveLength(40);
    expect(line!.hidden).toBe(60);
  });

  it('loads old values only from an edit, and only the fields that changed', () => {
    expect(canLoadOldValues({ action: 'edit' })).toBe(true);
    expect(canLoadOldValues({ action: 'create' })).toBe(false);
    expect(canLoadOldValues({ action: 'delete' })).toBe(false);
    const current = {
      url: '/about',
      title: 'Giới thiệu QHHOJ',
      content: 'new',
      registrationRequired: true,
    };
    expect(
      prefillOf(current, { title: { before: 'Giới thiệu', after: 'Giới thiệu QHHOJ' } }),
    ).toEqual({
      ...current,
      title: 'Giới thiệu',
    });
  });

  it('ignores a before of the wrong type or an unknown field instead of corrupting the form', () => {
    const current = { url: '/about', title: 'T', content: 'c', registrationRequired: false };
    expect(
      prefillOf(current, { title: { before: 5, after: 'T' }, extra: { before: 'x', after: 'y' } }),
    ).toEqual(current);
  });
});
