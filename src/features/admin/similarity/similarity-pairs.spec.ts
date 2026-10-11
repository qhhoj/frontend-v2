import { describe, expect, it } from 'vitest';
import {
  fragmentOfLine,
  pairFilterFromQuery,
  percentText,
  toPairsRequest,
} from './similarity-pairs';

describe('similarity pairs', () => {
  it('reads the filter from the URL and sends the threshold as a 0-1 fraction', () => {
    const filter = pairFilterFromQuery({ minPercent: '70', page: '2', language: 'cpp' });
    expect(filter).toEqual({ problemId: '', language: 'cpp', minPercent: 70, page: 2 });
    expect(toPairsRequest(filter)).toEqual({ language: 'cpp', minSimilarity: 0.7, page: 2 });
  });

  it('ignores a threshold outside 0-100 and a bad page', () => {
    expect(pairFilterFromQuery({ minPercent: '140', page: 'x' })).toEqual({
      problemId: '',
      language: '',
      minPercent: null,
      page: 1,
    });
  });

  it('writes similarity as a whole percent', () => {
    expect(percentText(0.98)).toBe('98%');
    expect(percentText(0.705)).toBe('71%');
  });

  it('maps each line to the fragment covering it, on either side', () => {
    const fragments = [
      { leftStart: 4, leftEnd: 6, rightStart: 6, rightEnd: 8 },
      { leftStart: 11, leftEnd: 11, rightStart: 13, rightEnd: 13 },
    ];
    const left = fragmentOfLine(fragments, 'left');
    expect([3, 4, 6, 7, 11].map((line) => left.get(line))).toEqual([undefined, 0, 0, undefined, 1]);
    expect(fragmentOfLine(fragments, 'right').get(13)).toBe(1);
  });
});

describe('similarity pairs: the problem filter', () => {
  it('drops a problem filter that is not a uuid and keeps one that is', () => {
    expect(pairFilterFromQuery({ problemId: 'hcmus41c' }).problemId).toBe('');
    expect(
      pairFilterFromQuery({ problemId: '0198c3a1-7d2e-7b10-9a4f-1c2d3e4f5a6b' }).problemId,
    ).toBe('0198c3a1-7d2e-7b10-9a4f-1c2d3e4f5a6b');
  });
});
