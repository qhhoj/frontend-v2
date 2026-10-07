import { afterEach, beforeEach } from 'vitest';
import { stubMatchMedia } from './match-media';

beforeEach(() => {
  stubMatchMedia();
});

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});
