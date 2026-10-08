import { vi } from 'vitest';

type MediaListener = (event: { matches: boolean }) => void;

/** jsdom has no matchMedia. `prefers-color-scheme: dark` and `prefers-reduced-motion: reduce` answer from the options, any query told to `setQuery` answers as told, every other does not match. */
export function stubMatchMedia({ dark = false, reducedMotion = false } = {}) {
  let isDark = dark;
  let isReduced = reducedMotion;
  const answers = new Map<string, boolean>();
  const listeners = new Set<MediaListener>();
  const notify = (next: boolean) => listeners.forEach((listener) => listener({ matches: next }));
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return (
        answers.get(query) ??
        ((query.includes('prefers-color-scheme: dark') && isDark) ||
          (query.includes('prefers-reduced-motion: reduce') && isReduced))
      );
    },
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
  }));
  return {
    setQuery(query: string, matches: boolean) {
      answers.set(query, matches);
      notify(matches);
    },
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
