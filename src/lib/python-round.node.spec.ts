import { describe, expect, it } from 'vitest';
import { pythonRound } from './python-round';

describe('pythonRound', () => {
  it.each([
    [0.125, 2, 0.12],
    [0.375, 2, 0.38],
    [2.5, 0, 2],
    [3.5, 0, 4],
    [0.25, 1, 0.2],
    [-2.5, 0, -2],
  ])('rounds the exact tie %p to even at %p digits', (value, digits, rounded) =>
    expect(pythonRound(value, digits)).toBe(rounded),
  );

  it.each([
    [2.675, 2, 2.67],
    [1.06, 1, 1.1],
    [33.33333, 3, 33.333],
    [7, 1, 7],
  ])('rounds %p to the nearest at %p digits', (value, digits, rounded) =>
    expect(pythonRound(value, digits)).toBe(rounded),
  );
});
