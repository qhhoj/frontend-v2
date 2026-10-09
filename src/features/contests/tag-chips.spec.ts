import { describe, expect, it } from 'vitest';
import { contestTag, TAG_CATALOGUE } from '@/test/contest-extras-fixtures';
import { catalogueBySlug, isTagSlug, tagChipOf, tagFilterState } from './tag-chips';

const catalogue = catalogueBySlug(TAG_CATALOGUE);

describe('tag chips', () => {
  it('names and colours a catalogue slug with its own token classes', () => {
    expect(tagChipOf('quoc-gia', catalogue)).toMatchObject({
      slug: 'quoc-gia',
      label: 'Quốc gia',
      color: 'tag-5',
    });
    expect(tagChipOf('quoc-gia', catalogue).colorClass).toContain('tag-5');
  });

  it('shows a slug without a catalogue entry as itself, neutral', () => {
    expect(tagChipOf('tin-hoc-tre-2019', catalogue)).toEqual({
      slug: 'tin-hoc-tre-2019',
      label: 'tin-hoc-tre-2019',
      color: null,
      colorClass: 'border-line text-muted',
    });
  });

  it('accepts only slugs the backend pattern accepts', () => {
    expect(['olympic', 'a-1', 'x'.repeat(20)].map(isTagSlug)).toEqual([true, true, true]);
    expect(['', 'Olympic', 'a b', 'x'.repeat(21), 'đặc-biệt'].map(isTagSlug)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('applies a known tag, flags an unknown one, and applies any tag while the catalogue is unknown', () => {
    expect(tagFilterState(null, catalogue)).toBe('none');
    expect(tagFilterState('icpc', catalogue)).toBe('applied');
    expect(tagFilterState('abc-xyz', catalogue)).toBe('unknown');
    expect(tagFilterState('abc-xyz', undefined)).toBe('applied');
    expect(tagFilterState('icpc', catalogueBySlug([contestTag({ slug: 'other' })]))).toBe(
      'unknown',
    );
  });
});
