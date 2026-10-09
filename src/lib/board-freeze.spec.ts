import { describe, expect, it } from 'vitest';
import { isBoardFrozen } from './board-freeze';

describe('isBoardFrozen', () => {
  it.each([
    ['icpc', 60, true],
    ['vnoj', 1, true],
    ['icpc', 0, false],
    ['ioi', 60, false],
    ['default', 30, false],
    ['final_submission', 30, false],
  ] as const)(
    '%s with a %i-minute freeze window is frozen: %s',
    (formatName, minutes, expected) => {
      expect(isBoardFrozen({ formatName, frozenLastMinutes: minutes })).toBe(expected);
    },
  );
});
