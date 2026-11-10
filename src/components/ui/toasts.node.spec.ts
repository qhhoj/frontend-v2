import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_TOASTS,
  TOAST_LIFETIME_MS,
  dismissToast,
  pauseToast,
  resumeToast,
  showToast,
  toasts,
} from './toasts';

const texts = () => toasts.map((toast) => toast.text);

describe('toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const toast of [...toasts]) dismissToast(toast.id);
    vi.useRealTimers();
  });

  it('keeps the newest three', () => {
    for (const text of ['a', 'b', 'c', 'd']) showToast({ text });
    expect(toasts).toHaveLength(MAX_TOASTS);
    expect(texts()).toEqual(['b', 'c', 'd']);
  });

  it('closes a success after its lifetime but keeps a failure until closed', () => {
    showToast({ text: 'saved' });
    showToast({ text: 'failed', tone: 'danger' });
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
    expect(toasts).toHaveLength(0);
  });

  it('pushes out an older success before a failure', () => {
    showToast({ text: 'failed', tone: 'danger' });
    for (const text of ['a', 'b', 'c']) showToast({ text });
    expect(texts()).toEqual(['failed', 'b', 'c']);
  });
});
