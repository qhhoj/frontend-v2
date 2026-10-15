import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { verdictBitMood } from '@/mascot/verdict-bit';
import {
  VERDICT_CODES,
  caseVerdictOf,
  isPartial,
  submissionVerdictOf,
  verdictOf,
} from './verdicts';

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

describe('isPartial', () => {
  it('is an accepted result short of its maximum', () => {
    expect(isPartial('AC', 3.86, 5)).toBe(true);
    expect(isPartial('AC', 0, 5)).toBe(true);
  });

  it('is not full points, a zero-point maximum, unknown points, or any other verdict', () => {
    expect(isPartial('AC', 5, 5)).toBe(false);
    expect(isPartial('AC', 0, 0)).toBe(false);
    expect(isPartial('AC', null, 800)).toBe(false);
    expect(isPartial('AC', 719.2, undefined)).toBe(false);
    expect(isPartial('WA', 2, 5)).toBe(false);
    expect(isPartial('TLE', 0, 5)).toBe(false);
  });
});

const finished = (result: 'AC' | 'WA', points: number | null, max: number) => ({
  status: 'D' as const,
  result,
  points,
  problem: { points: max },
});

describe('submissionVerdictOf', () => {
  it('shows a partial AC as PC with its own label and tone', () => {
    expect(submissionVerdictOf(finished('AC', 719.2, 800))).toEqual({
      code: 'PC',
      tone: 'pc',
      labelKey: 'verdicts.PC',
    });
  });

  it('keeps AC for full points and the judge verdict for anything else', () => {
    expect(submissionVerdictOf(finished('AC', 800, 800)).code).toBe('AC');
    expect(submissionVerdictOf(finished('WA', 400, 800)).code).toBe('WA');
    expect(submissionVerdictOf({ ...finished('AC', 10, 800), problem: null }).code).toBe('AC');
    expect(submissionVerdictOf({ ...finished('AC', 10, 800), status: 'G' }).code).toBe('G');
  });
});

describe('caseVerdictOf', () => {
  it('compares a test with its own total', () => {
    expect(caseVerdictOf({ status: 'AC', points: 2.89, total: 5 }).code).toBe('PC');
    expect(caseVerdictOf({ status: 'AC', points: 5, total: 5 }).code).toBe('AC');
    expect(caseVerdictOf({ status: 'AC', points: 0, total: 0 }).code).toBe('AC');
    expect(caseVerdictOf({ status: 'WA', points: 0, total: 5 }).code).toBe('WA');
  });
});

describe('verdictBitMood', () => {
  it('crowns a full AC only: a partial result gets no Bit', () => {
    expect(verdictBitMood(submissionVerdictOf(finished('AC', 800, 800)))).toBe('crown');
    expect(verdictBitMood(submissionVerdictOf(finished('AC', 719.2, 800)))).toBeNull();
    expect(verdictBitMood(submissionVerdictOf(finished('WA', 0, 800)))).toBe('sweat');
  });
});
