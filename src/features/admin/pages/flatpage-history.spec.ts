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
