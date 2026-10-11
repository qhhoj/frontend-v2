import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { VERDICT_CODES, verdictOf } from './verdicts';

describe('verdictOf', () => {
  it('keeps showing the status while a result already exists but grading is not done', () => {
    expect(verdictOf({ status: 'G', result: 'WA' }).code).toBe('G');
  });

  it('has a label for every code in both locales', () => {
    const missing = VERDICT_CODES.flatMap((code) =>
      (['vi', 'en'] as const)
        .filter((locale) => !i18n.global.te(`verdicts.${code}`, locale))
        .map((locale) => `${locale}:${code}`),
    );
    expect(missing).toEqual([]);
  });
});
