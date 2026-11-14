import { describe, expect, it } from 'vitest';
import { expiryText } from './share-expiry';

const NOW = Date.parse('2026-11-14T10:00:00Z');
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe('expiryText', () => {
  it('says never for a link without an end', () => {
    expect(expiryText(null, NOW)).toEqual({ key: 'never' });
  });

  it('counts whole days left, rounded up, from a day on', () => {
    expect(expiryText(at(29 * DAY + HOUR), NOW)).toEqual({ key: 'days', count: 30 });
    expect(expiryText(at(DAY), NOW)).toEqual({ key: 'days', count: 1 });
  });

  it('counts hours under a day and says "soon" under an hour', () => {
    expect(expiryText(at(DAY - 1), NOW)).toEqual({ key: 'hours', count: 24 });
    expect(expiryText(at(HOUR + 1), NOW)).toEqual({ key: 'hours', count: 2 });
    expect(expiryText(at(HOUR - 1), NOW)).toEqual({ key: 'soon' });
  });

  it('says expired at the end and after it', () => {
    expect(expiryText(at(0), NOW)).toEqual({ key: 'expired' });
    expect(expiryText(at(-DAY), NOW)).toEqual({ key: 'expired' });
  });
});
