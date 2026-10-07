import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, beforeEach, expect } from 'vitest';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { stubMatchMedia } from './match-media';
import { takeUnmatchedRequests } from './mock-api';

beforeEach(() => {
  stubMatchMedia();
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
