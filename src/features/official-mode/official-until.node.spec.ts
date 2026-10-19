import { describe, expect, it } from 'vitest';
import { untilText } from './official-until';

const at = (hours: number, minutes: number, seconds = 0, day = 9) =>
  new Date(2026, 9, day, hours, minutes, seconds);

describe('untilText', () => {
  it('says "hôm nay" when the end falls on the viewer\'s day and the date otherwise', () => {
    const now = at(10, 0).getTime();
    expect(untilText(at(11, 30).toISOString(), now, 'vi')).toBe('11:30 hôm nay');
    expect(untilText(at(11, 30, 0, 10).toISOString(), now, 'vi')).toBe('10/10/2026 11:30');
  });
});
