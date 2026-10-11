import { describe, expect, it } from 'vitest';
import { flatpagePath } from './flatpage-path';

describe('flatpagePath', () => {
  it('joins the catch-all segments without empty parts or trailing slash', () => {
    expect(flatpagePath(['about', 'rules', ''])).toBe('about/rules');
    expect(flatpagePath('about/rules/')).toBe('about/rules');
  });
});
