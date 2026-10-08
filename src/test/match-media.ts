import { vi } from 'vitest';

type MediaListener = (event: { matches: boolean }) => void;

/** jsdom has no matchMedia. Only `prefers-color-scheme: dark` and `prefers-reduced-motion: reduce` answer from the options; other queries do not match. */
export function stubMatchMedia({ dark = false, reducedMotion = false } = {}) {
  let isDark = dark;
  let isReduced = reducedMotion;
  const listeners = new Set<MediaListener>();
  const notify = (next: boolean) => listeners.forEach((listener) => listener({ matches: next }));
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return (
        (query.includes('prefers-color-scheme: dark') && isDark) ||
        (query.includes('prefers-reduced-motion: reduce') && isReduced)
      );
    },
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
  }));
  return {
    setDark(next: boolean) {
      isDark = next;
      notify(next);
    },
    setReducedMotion(next: boolean) {
      isReduced = next;
      notify(next);
    },
  };
}
