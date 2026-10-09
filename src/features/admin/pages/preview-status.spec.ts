import { describe, expect, it } from 'vitest';
import { previewStatusOf } from './preview-status';

const state = (overrides = {}) => ({
  isUntouched: false,
  isUpdating: false,
  isRateLimited: false,
  ...overrides,
});

describe('preview status', () => {
  it('shows the saved page while the text is the saved text, whatever the preview is doing', () => {
    expect(
      previewStatusOf(state({ isUntouched: true, isUpdating: true, isRateLimited: true })),
    ).toBe('saved');
  });

  it('prefers "updating" over "paused": a keystroke after the wait is a new request', () => {
    expect(previewStatusOf(state({ isUpdating: true, isRateLimited: true }))).toBe('updating');
  });

  it('is paused after a 429 with nothing in flight, and done otherwise', () => {
    expect(previewStatusOf(state({ isRateLimited: true }))).toBe('paused');
    expect(previewStatusOf(state())).toBe('done');
  });
});
