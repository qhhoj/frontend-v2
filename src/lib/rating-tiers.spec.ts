import { describe, expect, it } from 'vitest';
import { ratingTier, tierColor } from './rating-tiers';

describe('rating tiers', () => {
  it('follows the legacy boundaries (a boundary value starts the next tier)', () => {
    expect(ratingTier(1199)).toBe('newbie');
    expect(ratingTier(1200)).toBe('pupil');
    expect(ratingTier(1899)).toBe('expert');
    expect(ratingTier(1900)).toBe('candidate-master');
    expect(ratingTier(2104)).toBe('candidate-master');
    expect(ratingTier(2899)).toBe('international-grandmaster');
    expect(ratingTier(2900)).toBe('legendary-grandmaster');
  });

  it('leaves unrated users without a tier', () => {
    expect(ratingTier(null)).toBeNull();
    expect(tierColor(null)).toBe('none');
  });

  it('shares one colour between the master and grandmaster variants', () => {
    expect(tierColor('international-master')).toBe(tierColor('master'));
    expect(tierColor('legendary-grandmaster')).toBe(tierColor('grandmaster'));
    expect(tierColor('candidate-master')).toBe('candidate-master');
  });
});
