import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_TOASTS,
  TOAST_LIFETIME_MS,
  adminToasts,
  dismissToast,
  pauseToast,
  resumeToast,
  showToast,
} from './admin-toasts';

const texts = () => adminToasts.map((toast) => toast.text);

describe('admin toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const toast of [...adminToasts]) dismissToast(toast.id);
    vi.useRealTimers();
  });

  it('keeps the newest three', () => {
    for (const text of ['a', 'b', 'c', 'd']) showToast({ text });
    expect(adminToasts).toHaveLength(MAX_TOASTS);
    expect(texts()).toEqual(['b', 'c', 'd']);
  });

  it('closes a success after its lifetime but keeps an error until closed', () => {
    showToast({ text: 'saved' });
    showToast({ text: 'failed', tone: 'error' });
    vi.advanceTimersByTime(TOAST_LIFETIME_MS);
    expect(texts()).toEqual(['failed']);
    vi.advanceTimersByTime(TOAST_LIFETIME_MS * 10);
    expect(texts()).toEqual(['failed']);
  });

  it('does not close while paused and gets a full lifetime after', () => {
    const id = showToast({ text: 'saved' });
    vi.advanceTimersByTime(TOAST_LIFETIME_MS - 100);
    pauseToast(id);
    vi.advanceTimersByTime(TOAST_LIFETIME_MS * 2);
    expect(texts()).toEqual(['saved']);
    resumeToast(id);
    vi.advanceTimersByTime(TOAST_LIFETIME_MS - 1);
    expect(texts()).toEqual(['saved']);
    vi.advanceTimersByTime(1);
    expect(adminToasts).toHaveLength(0);
  });
});
