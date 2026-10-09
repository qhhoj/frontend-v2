import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { FakeEventSource, installFakeEventSource } from './fake-event-source';
import { stubMatchMedia } from './match-media';
import { takeUnmatchedRequests } from './mock-api';

beforeEach(() => {
  installFakeEventSource(); // jsdom has no EventSource; pages with a live feed open one on mount
  stubMatchMedia();
  // A strong device by default: low-power `auto` must stay off unless a spec passes weak hints (src/theme/low-power.ts).
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
  Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
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
  delete document.documentElement.dataset.accent;
  delete document.documentElement.dataset.lowPower;
  document.documentElement.style.removeProperty('--qh-glass-level');
  document.documentElement.style.removeProperty('--qh-blob-strength');
  document.documentElement.style.colorScheme = '';
  document.documentElement.lang = '';
  i18n.global.locale.value = DEFAULT_LOCALE;
  document.body.innerHTML = '';
  expect(unmatched, 'requests without a mockApi route').toEqual([]);
  // The auto-unmount hook (registered below) runs first, so a stream still open here leaked past its page.
  const openStreams = FakeEventSource.instances.filter((source) => !source.closed);
  expect(
    openStreams.map((source) => source.url),
    'event streams left open after unmount',
  ).toEqual([]);
});

// Registered last so it runs first (after-hooks run in stack order): mounted apps stop their timers and streams.
enableAutoUnmount(afterEach);
