import { describe, expect, it } from 'vitest';
import { contestTag } from '@/test/contest-extras-fixtures';
import { checkTagForm, emptyTagForm, tagFormOf, toTagPatch } from './contest-tag-form';

describe('contest tag form', () => {
  it('names every field the backend would refuse', () => {
    const errors = checkTagForm(
      { slug: 'Quốc gia', name: '   ', color: 'tag-2', description: 'x'.repeat(201), order: 1001 },
      true,
    );
    expect(Object.keys(errors).sort()).toEqual(['description', 'name', 'order', 'slug']);
    expect(
      checkTagForm({ ...emptyTagForm(), slug: 'ok', name: 'x'.repeat(41) }, true),
    ).toHaveProperty('name');
    expect(
      checkTagForm({ ...emptyTagForm(), slug: 'ok', name: 'A', order: 1.5 }, true),
    ).toHaveProperty('order');
  });

  it('never checks the slug of an existing tag (it cannot change)', () => {
    const form = { ...tagFormOf(contestTag({ slug: 'legacy_Slug' })), name: 'Legacy' };
    expect(checkTagForm(form, false)).toEqual({});
  });

  it('patches only what changed', () => {
    const tag = contestTag({ name: 'Quốc gia', color: 'tag-5', description: '', order: 5 });
    expect(toTagPatch(tag, tagFormOf(tag))).toEqual({});
    expect(toTagPatch(tag, { ...tagFormOf(tag), color: 'tag-2', order: 1 })).toEqual({
      color: 'tag-2',
      order: 1,
    });
  });
});
