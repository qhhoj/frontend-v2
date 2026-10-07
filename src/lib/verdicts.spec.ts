import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { VERDICT_CODES, verdictOf } from './verdicts';

describe('verdictOf', () => {
  it('shows the result of a graded submission', () => {
    expect(verdictOf({ status: 'D', result: 'WA' })).toEqual({
      code: 'WA',
      tone: 'wa',
      labelKey: 'verdicts.WA',
    });
  });

  it('shows the status while the submission is not finished', () => {
    expect(verdictOf({ status: 'G', result: null })).toMatchObject({ code: 'G', tone: 'pending' });
    expect(verdictOf({ status: 'PD', result: null })).toMatchObject({
      code: 'PD',
      tone: 'pending',
    });
  });

  it('keeps showing the status while a result already exists but grading is not done', () => {
    expect(verdictOf({ status: 'G', result: 'WA' }).code).toBe('G');
  });

  it('shows a final status that carries no result', () => {
    expect(verdictOf({ status: 'CE', result: null })).toMatchObject({ code: 'CE', tone: 'ce' });
  });

  it('groups limits and runtime failures like the legacy colours', () => {
    expect(verdictOf({ status: 'D', result: 'MLE' }).tone).toBe(
      verdictOf({ status: 'D', result: 'TLE' }).tone,
    );
    expect(verdictOf({ status: 'D', result: 'IR' }).tone).toBe(
      verdictOf({ status: 'D', result: 'RTE' }).tone,
    );
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
