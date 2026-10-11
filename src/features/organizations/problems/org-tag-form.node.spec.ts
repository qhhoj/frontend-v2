import { describe, expect, it } from 'vitest';
import { TAGS } from '@/test/f4-fixtures';
import { changesOf, createBodyOf, emptyTagForm, tagFormErrors, tagFormOf } from './org-tag-form';

describe('org tag form', () => {
  it('refuses a malformed slug on create only, and an empty or long name always', () => {
    const form = { slug: 'Bad Slug', name: '   ', color: 'tag-1' } as const;
    expect(tagFormErrors(form, true)).toEqual({
      slug: 'orgProblems.tags.errors.slug',
      name: 'orgProblems.tags.errors.name',
    });
    expect(tagFormErrors({ ...form, name: 'x'.repeat(41) }, false)).toEqual({
      name: 'orgProblems.tags.errors.name',
    });
  });

  it('sends slug, trimmed name and colour on create, and never the slug on edit', () => {
    const form = { ...emptyTagForm(), slug: 'ds', name: ' DS ', color: 'tag-5' as const };
    expect(createBodyOf(form)).toEqual({ slug: 'ds', name: 'DS', color: 'tag-5' });
    expect(changesOf(tagFormOf(TAGS[1]!))).toEqual({ name: 'Đồ thị', color: 'tag-2' });
  });
});
