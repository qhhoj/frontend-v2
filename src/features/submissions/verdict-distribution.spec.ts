import { describe, expect, it } from 'vitest';
import { shareLabel, verdictShares } from './verdict-distribution';

describe('verdictShares', () => {
  it('orders results AC first in verdict order, whatever order the counts came in', () => {
    const shares = verdictShares([
      { result: 'CE', count: 1 },
      { result: 'WA', count: 5 },
      { result: 'AC', count: 2 },
      { result: 'TLE', count: 2 },
    ]);
    expect(shares.map(({ result }) => result)).toEqual(['AC', 'WA', 'TLE', 'CE']);
  });

  it('gives whole percents that add up to exactly 100', () => {
    const shares = verdictShares([
      { result: 'AC', count: 1 },
      { result: 'WA', count: 1 },
      { result: 'TLE', count: 1 },
    ]);
    expect(shares.map(({ percent }) => percent)).toEqual([34, 33, 33]);
    const many = verdictShares([
      { result: 'AC', count: 617 },
      { result: 'WA', count: 233 },
      { result: 'TLE', count: 91 },
      { result: 'RTE', count: 47 },
      { result: 'CE', count: 12 },
    ]);
    expect(many.reduce((sum, { percent }) => sum + percent, 0)).toBe(100);
  });

  it('drops empty results and answers nothing when nothing was judged', () => {
    expect(verdictShares([])).toEqual([]);
    expect(verdictShares([{ result: 'AC', count: 0 }])).toEqual([]);
    expect(
      verdictShares([
        { result: 'AC', count: 3 },
        { result: 'WA', count: 0 },
      ]),
    ).toEqual([{ result: 'AC', count: 3, percent: 100, tone: 'ac' }]);
  });

  it('colours by the verdict block tones, system outcomes and unknown codes as system', () => {
    const tones = verdictShares([
      { result: 'MLE', count: 1 },
      { result: 'IE', count: 1 },
      { result: 'XYZ', count: 1 },
    ]).map(({ result, tone }) => [result, tone]);
    expect(tones).toEqual([
      ['MLE', 'tle'],
      ['IE', 'sys'],
      ['XYZ', 'sys'],
    ]);
  });

  it('labels a result too rare for a whole percent as under one percent', () => {
    const [ac, wa] = verdictShares([
      { result: 'AC', count: 999 },
      { result: 'WA', count: 1 },
    ]);
    expect(shareLabel(ac!)).toBe('100%');
    expect(shareLabel(wa!)).toBe('<1%');
  });
});
