import { describe, expect, it } from 'vitest';
import { contestStats } from '@/test/fixtures';
import { formatPercent, languageShare, resultSegments, statsTotals } from './stats-summary';

describe('contest stats summary', () => {
  it('adds up submissions and accepted ones over every problem', () => {
    expect(statsTotals(contestStats())).toEqual({
      submissions: 505,
      accepted: 412,
      acceptedShare: 412 / 505,
    });
  });
  it('has no share when nothing was submitted', () => {
    expect(statsTotals(contestStats({ problems: [] })).acceptedShare).toBeNull();
  });
  it('splits a problem into result segments in a fixed order, dropping empty ones', () => {
    const [first, second] = contestStats().problems;
    expect(resultSegments(first!.results, first!.total).map((segment) => segment.code)).toEqual([
      'AC',
      'WA',
      'CE',
      'TLE',
      'ERR',
    ]);
    expect(resultSegments(first!.results, first!.total)[0]!.share).toBeCloseTo(412 / 505);
    expect(resultSegments(second!.results, second!.total)).toEqual([]);
  });
  it('gives each language its share of all submissions', () => {
    const { languages } = contestStats();
    expect(languageShare(languages[0]!, languages)).toBeCloseTo(1952 / 2354);
    expect(languageShare(languages[0]!, [])).toBe(0);
  });
  it('prints percentages with one decimal in the locale', () => {
    expect(formatPercent(81.6, 'vi')).toBe('81,6%');
    expect(formatPercent(81.6, 'en')).toBe('81.6%');
  });
});
