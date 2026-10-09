import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { navItem } from '@/test/admin-fixtures/site';
import { checkNavForm, navBody, navIssueTexts, navPatch, toNavForm } from './nav-form';

const base = () =>
  toNavForm(navItem({ key: 'help', label: 'Trợ giúp', path: '/help', parentId: 'nav-blog' }));

describe('nav form', () => {
  it('checks length, path, regex and order before any request', () => {
    const form = {
      ...base(),
      key: '',
      label: 'x'.repeat(21),
      path: 'javascript:alert(1)',
      regex: '(',
      order: -1,
    };
    expect(Object.keys(checkNavForm(form)).sort()).toEqual([
      'key',
      'label',
      'order',
      'path',
      'regex',
    ]);
    expect(checkNavForm(base())).toEqual({});
  });

  it('sends only what changed on an edit, and an emptied parent as null', () => {
    const before = base();
    expect(navPatch(before, { ...before, label: 'Mới' })).toEqual({ label: 'Mới' });
    expect(navPatch(before, { ...before, parentId: '' })).toEqual({ parentId: null });
  });

  it('leaves an empty parent out of a create body', () => {
    expect(navBody({ ...base(), parentId: '' })).not.toHaveProperty('parentId');
    expect(navBody(base()).parentId).toBe('nav-blog');
  });

  it('words backend issue codes under the field they belong to, and a duplicate key under the key', () => {
    const cycle = new ApiError('validation_failed', 400, 'x', {
      issues: [{ field: 'parentId', code: 'parent_cycle', message: 'cycle' }],
    });
    expect(Object.keys(navIssueTexts(cycle))).toEqual(['parentId']);
    expect(navIssueTexts(cycle).parentId).toBe(
      'Một mục không thể nằm dưới chính nó hoặc mục con của nó.',
    );
    expect(
      navIssueTexts(new ApiError('conflict', 409, 'x', { fields: { key: ['taken'] } })),
    ).toEqual({
      key: 'Khoá đã có.',
    });
  });
});
