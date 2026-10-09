import { describe, expect, it } from 'vitest';
import { formatDateTime } from '@/lib/format';
import { participation } from '@/test/admin-fixtures/contests';
import { formatPenalty, participationKindKey, rulesAcceptanceText } from './participations';

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

describe('rules acceptance text', () => {
  it('names the accepted revision and time, and a dash when nothing was accepted', () => {
    expect(rulesAcceptanceText(participation(), 'vi')).toBe('—');
    const accepted = participation({
      rulesAcceptedAt: '2026-10-08T05:58:00.000Z',
      rulesAcceptedRevision: 3,
    });
    const text = rulesAcceptanceText(accepted, 'vi');
    expect(text).toContain('bản 3');
    expect(text).toContain(formatDateTime('2026-10-08T05:58:00.000Z', 'vi'));
  });
});
