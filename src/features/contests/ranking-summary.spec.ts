import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { rankingSummary } from './ranking-summary';

describe('rankingSummary', () => {
  it.each([
    [1, 1, 'ICPC · 1 problem · 1 contestant'],
    [3, 2, 'ICPC · 3 problems · 2 contestants'],
  ])('%i problems and %i participants read in English plurals', (problems, participants, text) => {
    i18n.global.locale.value = 'en';
    try {
      expect(rankingSummary('icpc', problems, participants)).toBe(text);
    } finally {
      i18n.global.locale.value = 'vi';
    }
  });
});
