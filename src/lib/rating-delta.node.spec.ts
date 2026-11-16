import { describe, expect, it } from 'vitest';
import { deltaTone, formatDelta } from './rating-delta';

describe('rating delta', () => {
  it('signs gains, keeps the minus of losses and leaves zero bare', () => {
    expect([42, -7, 0].map(formatDelta)).toEqual(['+42', '-7', '0']);
  });

  it('colours gains and losses, and neither a zero nor a first rating', () => {
    expect([42, -7, 0, null].map(deltaTone)).toEqual(['full', 'zero', 'neutral', 'neutral']);
  });
});
