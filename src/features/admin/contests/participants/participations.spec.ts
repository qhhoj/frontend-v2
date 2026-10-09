import { describe, expect, it } from 'vitest';
import { formatPenalty, participationKindKey } from './participations';

describe('participations', () => {
  it('names live, spectating and numbered virtual participations', () => {
    expect(participationKindKey(0)).toEqual({ key: 'admin.contests.participants.kinds.live' });
    expect(participationKindKey(-1)).toEqual({ key: 'admin.contests.participants.kinds.spectate' });
    expect(participationKindKey(2)).toEqual({
      key: 'admin.contests.participants.kinds.virtual',
      params: { number: 2 },
    });
  });

  it('writes penalty time in hours and minutes', () => {
    expect(formatPenalty(4 * 3600 + 12 * 60 + 5, 'vi')).toBe('4 giờ 12 phút');
    expect(formatPenalty(0, 'vi')).toBe('–');
  });
});
