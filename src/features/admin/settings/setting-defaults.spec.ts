import { describe, expect, it } from 'vitest';
import { setting } from '@/test/admin-fixtures/settings';
import {
  canResetToDefault,
  defaultDraftOf,
  isAtDefault,
  isFilledFromDefault,
  valueText,
} from './setting-defaults';

const minPercent = (stored: number) =>
  setting('similarity.minPercent', stored, { default: 50, isDefault: stored === 50 });

describe('setting defaults', () => {
  it('offers a reset for plain settings and never for one with a sealed part', () => {
    expect(canResetToDefault(minPercent(65))).toBe(true);
    for (const sealed of [
      setting('mail.smtpUrl', { set: true }),
      setting('discord.webhooks', { set: true }),
      setting('auth.google', { enabled: false, clientId: '', clientSecret: { set: false } }),
    ])
      expect(canResetToDefault(sealed), sealed.key).toBe(false);
  });

  it('fills the registry default, not the stored value', () => {
    expect(defaultDraftOf(minPercent(65))).toEqual({ value: 50 });
  });

  it('is at the default when the box equals it, whatever is stored', () => {
    expect(isAtDefault(minPercent(65), { value: 50 })).toBe(true);
    expect(isAtDefault(minPercent(50), { value: 70 })).toBe(false);
  });

  it('flags "filled, not saved" only when the box holds the default and the stored value differs', () => {
    expect(isFilledFromDefault(minPercent(65), { value: 50 })).toBe(true);
    expect(isFilledFromDefault(minPercent(65), { value: 65 })).toBe(false);
    expect(isFilledFromDefault(minPercent(50), { value: 50 })).toBe(false);
  });

  it('words a value for the hint: grouped numbers, on/off, empty', () => {
    expect(valueText(2000, 'vi')).toMatch(/^2\D?000$/);
    expect(valueText(true, 'vi')).toBe('bật');
    expect(valueText(false, 'vi')).toBe('tắt');
    expect(valueText('', 'vi')).toBe('(trống)');
    expect(valueText('Asia/Ho_Chi_Minh', 'vi')).toBe('Asia/Ho_Chi_Minh');
  });
});
