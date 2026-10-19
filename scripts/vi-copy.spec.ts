import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { moveMarkToMainVowel, valueProblems, viCopyOffences } from './vi-copy.mjs';

const problems = (value: string): string[] => valueProblems(value);

describe('tone mark on the second vowel of an open oa/oe/uy syllable', () => {
  it.each([
    'hoá',
    'hoà',
    'xoá',
    'khoẻ',
    'huỷ',
    'tuỳ',
    'thuỷ',
    'hoạ',
    'luỵ',
    'khoã',
    'Xoá bài?',
    'Huỷ thay đổi',
    'HOÁ ĐƠN',
    'Chọn xoá.',
    'Đã {count} xoá',
  ])('flags %s', (value) => {
    expect(problems(value)).toHaveLength(1);
  });

  it.each([
    'hóa',
    'hòa',
    'xóa',
    'khỏe',
    'hủy',
    'tùy',
    'thủy',
    'họa',
    'Hủy thay đổi',
    'Xóa bài?',
    'HÓA ĐƠN',
  ])('accepts the main-vowel form %s', (value) => {
    expect(problems(value)).toEqual([]);
  });

  it.each([
    'hoàn',
    'toán',
    'khoáng',
    'hoạch',
    'loạt',
    'thuyền',
    'quyết',
    'huỳnh',
    'khoèo',
    'ngoáy',
  ])(
    'keeps the mark on the second vowel when the syllable does not end in oa/oe/uy: %s',
    (value) => {
      expect(problems(value)).toEqual([]);
    },
  );

  it.each(['quý', 'Quý', 'QUÝ', 'quỳ', 'quả', 'quá', 'quà', 'giá', 'giả'])(
    'keeps the mark after qu- and gi-: %s',
    (value) => {
      expect(problems(value)).toEqual([]);
    },
  );

  it('suggests the main-vowel spelling, keeping case', () => {
    expect(problems('Huỷ')).toEqual(['tone mark on the second vowel: uỷ (write ủy)']);
    expect(problems('XOÁ')).toEqual(['tone mark on the second vowel: OÁ (write ÓA)']);
  });

  it('flags every offending word of a message', () => {
    expect(problems('Xoá hoặc huỷ')).toHaveLength(2);
  });

  it('reads decomposed text like composed text', () => {
    expect(problems('xoá'.normalize('NFD'))).toHaveLength(1);
    expect(problems('xóa'.normalize('NFD'))).toEqual([]);
  });
});

describe('moveMarkToMainVowel', () => {
  it.each([
    ['oá', 'óa'],
    ['oà', 'òa'],
    ['oẻ', 'ỏe'],
    ['oạ', 'ọa'],
    ['uỷ', 'ủy'],
    ['uỳ', 'ùy'],
    ['uỵ', 'ụy'],
    ['OÁ', 'ÓA'],
    ['Uỷ', 'Ủy'],
  ])('%s → %s', (pair, moved) => {
    expect(moveMarkToMainVowel(pair)).toBe(moved);
  });
});

describe('ASCII double quotes', () => {
  it('flags one inside a message and accepts “ ”', () => {
    expect(problems('Chọn "Ẩn" để hiển thị')).toEqual(['ASCII double quote (write “ ”)']);
    expect(problems('Chọn “Ẩn” để hiển thị')).toEqual([]);
  });

  it('accepts an apostrophe', () => {
    expect(problems("Bài của bạn's")).toEqual([]);
  });
});

describe('viCopyOffences', () => {
  it('names the key path of every offending string, in nested objects and arrays', () => {
    const messages = {
      form: { saveBar: { discard: 'Huỷ thay đổi', save: 'Lưu' } },
      list: ['Xóa', 'Xoá "x"'],
      count: 3,
      nothing: null,
    };
    expect(viCopyOffences(messages)).toEqual([
      'form.saveBar.discard: tone mark on the second vowel: uỷ (write ủy)',
      'list.1: tone mark on the second vowel: oá (write óa)',
      'list.1: ASCII double quote (write “ ”)',
    ]);
  });

  it('is empty for messages that follow the convention', () => {
    expect(viCopyOffences({ a: { b: 'Hủy', c: 'Quý khách “A”' } })).toEqual([]);
  });
});
