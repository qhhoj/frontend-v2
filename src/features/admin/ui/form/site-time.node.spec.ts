import { describe, expect, it } from 'vitest';
import { formatInZone, parseInZone, zoneLabel } from './site-time';

describe('site time', () => {
  it('shows an API instant on the site clock', () => {
    expect(formatInZone('2026-10-08T06:00:00Z')).toBe('08/10/2026 13:00');
    expect(formatInZone('2026-12-31T17:30:00Z')).toBe('01/01/2027 00:30');
  });

  it('reads typed site time back as the same instant', () => {
    expect(parseInZone('08/10/2026 13:00')).toEqual({ ok: true, iso: '2026-10-08T06:00:00.000Z' });
    expect(parseInZone(formatInZone('2026-03-01T23:59:00Z'))).toEqual({
      ok: true,
      iso: '2026-03-01T23:59:00.000Z',
    });
  });

  it('accepts loose typing: one-digit parts, other separators, a date alone', () => {
    expect(parseInZone(' 8/1/2026, 7:05 ')).toEqual({ ok: true, iso: '2026-01-08T00:05:00.000Z' });
    expect(parseInZone('08-10-2026')).toEqual({ ok: true, iso: '2026-10-07T17:00:00.000Z' });
  });

  it('treats empty as no value and refuses impossible or malformed text', () => {
    expect(parseInZone('  ')).toEqual({ ok: true, iso: null });
    for (const text of [
      '31/02/2026 10:00',
      '08/10/2026 24:00',
      '08/10/2026 13:60',
      '13:00',
      '2026-10-08',
      'mai',
    ])
      expect(parseInZone(text)).toEqual({ ok: false });
  });

  it('lands on the right side of a daylight-saving change', () => {
    expect(parseInZone('29/03/2026 03:30', 'Europe/Berlin')).toEqual({
      ok: true,
      iso: '2026-03-29T01:30:00.000Z',
    });
    expect(parseInZone('25/10/2026 12:00', 'Europe/Berlin')).toEqual({
      ok: true,
      iso: '2026-10-25T11:00:00.000Z',
    });
    expect(formatInZone('2026-07-01T10:00:00Z', 'Europe/Berlin')).toBe('01/07/2026 12:00');
  });

  it('names the zone offset', () => {
    expect(zoneLabel('Asia/Ho_Chi_Minh')).toBe('GMT+7');
    expect(zoneLabel('Asia/Kolkata')).toBe('GMT+5:30');
    expect(zoneLabel('UTC')).toBe('GMT');
    expect(zoneLabel('America/New_York', new Date('2026-01-15T12:00:00Z'))).toBe('GMT-5');
  });
});
