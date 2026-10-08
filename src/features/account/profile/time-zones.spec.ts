import { describe, expect, it } from 'vitest';
import { timeZoneOptions, utcOffsetLabel } from './time-zones';

const JANUARY = new Date('2026-01-15T12:00:00Z');
const JULY = new Date('2026-07-15T12:00:00Z');

describe('utcOffsetLabel', () => {
  it.each([
    ['Asia/Ho_Chi_Minh', JANUARY, 'UTC+7'],
    ['Asia/Kolkata', JANUARY, 'UTC+5:30'],
    ['America/New_York', JANUARY, 'UTC-5'],
    ['America/New_York', JULY, 'UTC-4'],
    ['UTC', JULY, 'UTC'],
  ])('%s at %s is %s', (zone, at, label) => {
    expect(utcOffsetLabel(zone, at)).toBe(label);
  });
});

describe('timeZoneOptions', () => {
  it('labels every zone with its offset', () => {
    expect(timeZoneOptions('Asia/Ho_Chi_Minh', JANUARY)).toContainEqual({
      value: 'Asia/Ho_Chi_Minh',
      label: 'Asia/Ho_Chi_Minh (UTC+7)',
    });
  });

  it('keeps a stored zone the browser does not list, first, so the select can show it', () => {
    const options = timeZoneOptions('Legacy/Zone', JANUARY);
    expect(options[0]).toEqual({ value: 'Legacy/Zone', label: 'Legacy/Zone' });
    expect(options.filter((option) => option.value === 'Legacy/Zone')).toHaveLength(1);
  });

  it('shows the default Vietnamese zone once, first, though Node 22 lists only its alias Asia/Saigon', () => {
    const options = timeZoneOptions('Asia/Ho_Chi_Minh', JANUARY);
    expect(options[0]).toEqual({ value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (UTC+7)' });
    expect(options.filter((option) => option.value === 'Asia/Ho_Chi_Minh')).toHaveLength(1);
  });
});
