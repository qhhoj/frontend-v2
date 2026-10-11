import { describe, expect, it } from 'vitest';
import { formatDateTime } from '@/lib/format';
import { participation } from '@/test/admin-fixtures/contests';
import { rulesAcceptanceText } from './participations';

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
