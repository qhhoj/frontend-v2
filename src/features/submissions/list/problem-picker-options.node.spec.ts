import { describe, expect, it } from 'vitest';
import { pickerOptions } from './problem-picker-options';

const listed = [{ code: 'a', label: 'A · Alpha' }];

describe('problem picker options', () => {
  it('starts with "every problem" as null, then the listed problems', () => {
    expect(pickerOptions({ listed, picked: '', anyLabel: 'Mọi bài' })).toEqual([
      { code: null, label: 'Mọi bài' },
      ...listed,
    ]);
  });

  it('keeps a picked code the list left out, so the box still names it', () => {
    expect(
      pickerOptions({ listed, picked: 'zz', anyLabel: 'x' }).map((option) => option.code),
    ).toEqual([null, 'zz', 'a']);
    expect(pickerOptions({ listed, picked: 'a', anyLabel: 'x' })).toHaveLength(2);
  });
});
