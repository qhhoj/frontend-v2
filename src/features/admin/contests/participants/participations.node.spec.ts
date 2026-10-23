import { describe, expect, it } from 'vitest';
import { participation } from '@/test/admin-fixtures/contests';
import { formatPenalty, rulesAcceptanceText } from './participations';

describe('rules acceptance text', () => {
  it('names the accepted revision and time, and a dash when nothing was accepted', () => {
    expect(rulesAcceptanceText(participation(), 'vi')).toBe('—');
    const accepted = participation({
      rulesAcceptedAt: '2026-10-08T05:58:00.000Z',
      rulesAcceptedRevision: 3,
    });
    const text = rulesAcceptanceText(accepted, 'vi');
    expect(text).toContain('bản 3');
    expect(text).toBe('bản 3 · 08/10/2026 12:58');
  });
});

describe('penalty text', () => {
  it('reads icpc penalties as minutes and other formats as seconds', () => {
    expect(formatPenalty(56, 'icpc', 'vi')).toBe('0 giờ 56 phút');
    expect(formatPenalty(135, 'icpc', 'vi')).toBe('2 giờ 15 phút');
    expect(formatPenalty(3360, 'ioi', 'vi')).toBe('0 giờ 56 phút');
  });

  it('shows a dash when there is no penalty', () => {
    expect(formatPenalty(0, 'icpc', 'vi')).toBe('–');
  });
});
