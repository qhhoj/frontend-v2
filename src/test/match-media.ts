import { vi } from 'vitest';

type MediaListener = (event: { matches: boolean }) => void;

/** jsdom has no matchMedia. Only `prefers-color-scheme: light` answers from `light`; other queries do not match. */
export function stubMatchMedia({ light = false } = {}) {
  let isLight = light;
  const listeners = new Set<MediaListener>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return query.includes('prefers-color-scheme: light') && isLight;
    },
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
  }));
  return {
    setLight(next: boolean) {
      isLight = next;
      listeners.forEach((listener) => listener({ matches: next }));
    },
  };
}
