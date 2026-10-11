import { describe, expect, it, vi } from 'vitest';
import { expiryPreview, MAX_EXPIRY_AMOUNT, toLinkPatch } from './ranking-link';

describe('ranking link form', () => {
  it('sends only what each expiry mode needs', () => {
    expect(
      toLinkPatch({
        status: 'public',
        expiryMode: 'U',
        expiryAmount: 7,
        expiresAt: '2026-10-15T06:00:00.000Z',
      }),
    ).toEqual({ status: 'public', expiryMode: 'U' });
    expect(
      toLinkPatch({ status: 'private', expiryMode: 'D', expiryAmount: 7, expiresAt: '' }),
    ).toEqual({ status: 'private', expiryMode: 'D', expiryAmount: 7 });
    expect(
      toLinkPatch({
        status: 'public',
        expiryMode: 'A',
        expiryAmount: null,
        expiresAt: '2026-10-15T06:00:00.000Z',
      }),
    ).toMatchObject({ expiryMode: 'A', expiresAt: '2026-10-15T06:00:00.000Z' });
  });

  it('refuses a missing or fractional amount and a missing date', () => {
    expect(
      toLinkPatch({ status: 'public', expiryMode: 'M', expiryAmount: null, expiresAt: '' }),
    ).toHaveProperty('error');
    expect(
      toLinkPatch({ status: 'public', expiryMode: 'D', expiryAmount: 1.5, expiresAt: '' }),
    ).toHaveProperty('error');
    expect(
      toLinkPatch({ status: 'public', expiryMode: 'A', expiryAmount: null, expiresAt: '' }),
    ).toHaveProperty('error');
  });

  it('accepts an amount up to the backend maximum and refuses one more', () => {
    expect(
      toLinkPatch({
        status: 'public',
        expiryMode: 'M',
        expiryAmount: MAX_EXPIRY_AMOUNT,
        expiresAt: '',
      }),
    ).toEqual({ status: 'public', expiryMode: 'M', expiryAmount: MAX_EXPIRY_AMOUNT });
    expect(
      toLinkPatch({
        status: 'public',
        expiryMode: 'M',
        expiryAmount: MAX_EXPIRY_AMOUNT + 1,
        expiresAt: '',
      }),
    ).toHaveProperty('error');
  });
});

describe('expiry preview in the viewer’s zone', () => {
  it('names the viewer’s own day and clock, so a regeneration at 00:30 local shows the local expiry day', () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    try {
      // 17:30 UTC on 08/10 is 00:30 on 09/10 in Ho Chi Minh City.
      const regeneratedAt = new Date('2026-10-08T17:30:00.000Z');
      expect(
        expiryPreview(
          { status: 'public', expiryMode: 'D', expiryAmount: 7, expiresAt: '' },
          regeneratedAt,
          'vi',
        ),
      ).toBe('Hết hạn sau 7 ngày kể từ lần tạo lại liên kết gần nhất, tức 16/10/2026.');
      expect(
        expiryPreview(
          { status: 'public', expiryMode: 'M', expiryAmount: 90, expiresAt: '' },
          regeneratedAt,
          'vi',
        ),
      ).toBe('Hết hạn sau 90 phút kể từ lần tạo lại liên kết gần nhất, tức 09/10/2026 lúc 02:00.');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
