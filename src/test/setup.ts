import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { installFakeEventSource } from './fake-event-source';
import { stubMatchMedia } from './match-media';
import { takeUnmatchedRequests } from './mock-api';

beforeEach(() => {
  installFakeEventSource(); // jsdom has no EventSource; pages with a live feed open one on mount
  stubMatchMedia();
  vi.stubGlobal('scrollTo', vi.fn()); // jsdom does not implement it; the router scrolls on every navigation
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ); // PrimeVue overlays watch their content size
});

afterEach(() => {
  const unmatched = takeUnmatchedRequests();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
  document.documentElement.lang = '';
  i18n.global.locale.value = DEFAULT_LOCALE;
  document.body.innerHTML = '';
  expect(unmatched, 'requests without a mockApi route').toEqual([]);
});

// Registered last so it runs first (after-hooks run in stack order): mounted apps stop their timers and streams.
enableAutoUnmount(afterEach);
