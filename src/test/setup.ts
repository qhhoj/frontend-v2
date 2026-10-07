import { afterEach, beforeEach } from 'vitest';
import { DEFAULT_LOCALE, i18n } from '@/i18n';
import { stubMatchMedia } from './match-media';

beforeEach(() => {
  stubMatchMedia();
});

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
  document.documentElement.lang = '';
  i18n.global.locale.value = DEFAULT_LOCALE;
});
