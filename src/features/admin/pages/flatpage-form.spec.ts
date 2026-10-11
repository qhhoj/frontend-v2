import { describe, expect, it } from 'vitest';
import { canonicalUrl, changedFlatpageFields, checkFlatpageForm } from './flatpage-form';

describe('flatpage form', () => {
  // The backend's `normalizeFlatpageUrl` rows (libs/community/src/flatpages.ts): same input, same answer.
  it.each([
    ['', null],
    ['/', null],
    ['//', null],
    ['/a/', '/a'],
    ['/a//b', '/a/b'],
    [' /a', '/ /a'],
    ['/a ', '/a '],
    ['..', null],
    ['/a/..', null],
    ['/../a', null],
    ['/a/./b', null],
    ['/a/.b', '/a/.b'],
    ['/a\nb', null],
    ['/a\u007fb', null],
    [`/${'x'.repeat(199)}`, `/${'x'.repeat(199)}`],
    [`/${'x'.repeat(200)}`, null],
    ['tài-liệu/1', '/tài-liệu/1'],
  ])('canonicalUrl(%j) is %j', (raw, expected) => {
    expect(canonicalUrl(raw)).toBe(expected);
  });

  it('does not trim: a stray space is a charset error the user must see', () => {
    const URL_ERROR = 'Ký tự ngoài chữ, số, “-”, “_”, “.”, “~” và “/”, hoặc đường dẫn rỗng.';
    expect(checkFlatpageForm({ url: ' /rules ', title: 'T', content: '' }).url).toBe(URL_ERROR);
    expect(checkFlatpageForm({ url: '/', title: 'T', content: '' }).url).toBe(URL_ERROR);
  });

  it('refuses characters outside the legacy charset and an empty title', () => {
    expect(Object.keys(checkFlatpageForm({ url: '/a b?', title: '', content: '' })).sort()).toEqual(
      ['title', 'url'],
    );
    expect(checkFlatpageForm({ url: '/tài-liệu', title: 'T', content: '' })).toEqual({});
  });

  it('sends only changed fields, with the URL canonical', () => {
    const before = {
      url: '/about',
      title: 'Giới thiệu',
      content: 'x',
      registrationRequired: false,
    };
    expect(changedFlatpageFields(before, { ...before, registrationRequired: true })).toEqual({
      registrationRequired: true,
    });
    expect(changedFlatpageFields(before, { ...before, url: 'gioi-thieu/' })).toEqual({
      url: '/gioi-thieu',
    });
  });
});
