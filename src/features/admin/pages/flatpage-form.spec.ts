import { describe, expect, it } from 'vitest';
import { canonicalUrl, changedFlatpageFields, checkFlatpageForm } from './flatpage-form';

describe('flatpage form', () => {
  it('canonicalises the URL like the backend: empty segments dropped, one leading slash', () => {
    expect(canonicalUrl('about/')).toBe('/about');
    expect(canonicalUrl('//a///b/')).toBe('/a/b');
    expect(canonicalUrl('/tài-liệu/1')).toBe('/tài-liệu/1');
  });

  it('refuses what the backend answers invalid_url for: nothing but slashes, dot segments, controls, too long', () => {
    expect(canonicalUrl('/')).toBeNull();
    expect(canonicalUrl('')).toBeNull();
    expect(canonicalUrl('/a/../b')).toBeNull();
    expect(canonicalUrl('/a/./b')).toBeNull();
    expect(canonicalUrl('/a\u0007b')).toBeNull();
    expect(canonicalUrl(`/${'x'.repeat(200)}`)).toBeNull();
  });

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
    expect(checkFlatpageForm({ url: ' /rules ', title: 'T', content: '' }).url).toBeDefined();
    expect(checkFlatpageForm({ url: '/', title: 'T', content: '' }).url).toBeDefined();
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
