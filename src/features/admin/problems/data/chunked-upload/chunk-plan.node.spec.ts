import { describe, expect, it } from 'vitest';
import { missingChunks, planChunks } from './chunk-plan';

describe('planChunks', () => {
  it('cuts every chunkBytes and leaves the rest to the last span', () => {
    expect(planChunks(25, 10)).toEqual([
      { index: 0, start: 0, end: 10 },
      { index: 1, start: 10, end: 20 },
      { index: 2, start: 20, end: 25 },
    ]);
  });
  it('makes no short last span when the size is a multiple', () => {
    expect(planChunks(20, 10).map(({ end }) => end)).toEqual([10, 20]);
  });
  it('covers a file smaller than one chunk with one span', () => {
    expect(planChunks(3, 10)).toEqual([{ index: 0, start: 0, end: 3 }]);
  });
  it('keeps only the spans the server lacks, in order', () => {
    expect(missingChunks(planChunks(25, 10), [2, 0]).map(({ index }) => index)).toEqual([1]);
  });
});
