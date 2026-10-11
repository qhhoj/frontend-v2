import { describe, expect, it } from 'vitest';
import { previewStatusOf } from './preview-status';

const state = (overrides = {}) => ({
  isUntouched: false,
  isUpdating: false,
  isRateLimited: false,
  ...overrides,
});

describe('preview status', () => {
  it('ranks saved over updating over paused: a keystroke after a 429 is a new request', () => {
    expect(
      previewStatusOf(state({ isUntouched: true, isUpdating: true, isRateLimited: true })),
    ).toBe('saved');
    expect(previewStatusOf(state({ isUpdating: true, isRateLimited: true }))).toBe('updating');
    expect(previewStatusOf(state({ isRateLimited: true }))).toBe('paused');
  });
});
