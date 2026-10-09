import { describe, expect, it } from 'vitest';
import { remainingText, untilText } from './official-until';

const at = (hours: number, minutes: number, seconds = 0, day = 9) =>
  new Date(2026, 9, day, hours, minutes, seconds);

describe('remainingText', () => {
  it('counts down to the end without a leading zero on the hours', () => {
    expect(remainingText(at(11, 30).toISOString(), at(10, 17, 20).getTime())).toBe('1:12:40');
  });

  it('stops at zero once the end has passed', () => {
    expect(remainingText(at(11, 30).toISOString(), at(12, 0).getTime())).toBe('0:00:00');
  });
});

describe('untilText', () => {
  it('says "hôm nay" when the end falls on the viewer\'s day and the date otherwise', () => {
    const now = at(10, 0).getTime();
    expect(untilText(at(11, 30).toISOString(), now, 'vi')).toBe('11:30 hôm nay');
    expect(untilText(at(11, 30, 0, 10).toISOString(), now, 'vi')).toBe('11:30 10/10');
  });
});
