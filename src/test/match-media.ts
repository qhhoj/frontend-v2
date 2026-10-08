import { vi } from 'vitest';

type MediaListener = (event: { matches: boolean }) => void;

/** jsdom has no matchMedia. Only `prefers-color-scheme: dark` answers from `dark`; other queries do not match. */
export function stubMatchMedia({ dark = false } = {}) {
  let isDark = dark;
  const listeners = new Set<MediaListener>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return query.includes('prefers-color-scheme: dark') && isDark;
    },
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
  }));
  return {
    setDark(next: boolean) {
      isDark = next;
      listeners.forEach((listener) => listener({ matches: next }));
    },
  };
}
