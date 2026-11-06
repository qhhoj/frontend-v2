import { describe, expect, it } from 'vitest';
import { missingChunks, planChunks } from './chunk-plan';

const MIB = 1024 * 1024;

describe('planChunks', () => {
  it.each([
    {
      size: 25,
      chunk: 10,
      spans: [
        [0, 10],
        [10, 20],
        [20, 25],
      ],
    },
    {
      size: 20,
      chunk: 10,
      spans: [
        [0, 10],
        [10, 20],
      ],
    },
    { size: 3, chunk: 10, spans: [[0, 3]] },
    { size: 48 * MIB, chunk: 48 * MIB, spans: [[0, 48 * MIB]] },
    { size: 0, chunk: 10, spans: [] },
  ])('cuts $size bytes every $chunk, the last span holding the rest', ({ size, chunk, spans }) => {
    expect(planChunks(size, chunk)).toEqual(
      spans.map(([start, end], index) => ({ index, start, end })),
    );
    expect(missingChunks(planChunks(size, chunk), [0]).map(({ index }) => index)).toEqual(
      spans.slice(1).map((_span, index) => index + 1),
    );
  });
});
