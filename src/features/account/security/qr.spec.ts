import { describe, expect, it } from 'vitest';
import { qrModules, qrPath } from './qr';

const URL_TEXT = 'otpauth://totp/QHHOJ:user_01?secret=JBSWY3DPEHPK3PXP&issuer=QHHOJ';

describe('qrModules', () => {
  it('is a square QR matrix without a quiet zone: 17 + 4·version modules a side', () => {
    const modules = qrModules(URL_TEXT);
    expect(modules.every((row) => row.length === modules.length)).toBe(true);
    expect((modules.length - 17) % 4).toBe(0);
  });

  it('starts with the top-left finder pattern (7 dark, then a light ring)', () => {
    const modules = qrModules(URL_TEXT);
    expect(modules[0]!.slice(0, 7)).toEqual(Array(7).fill(true));
    expect(modules[1]!.slice(0, 7)).toEqual([true, false, false, false, false, false, true]);
  });
});

describe('qrPath', () => {
  it('draws one unit square per dark module, at its column and row', () => {
    expect(
      qrPath([
        [true, false],
        [false, true],
      ]),
    ).toBe('M0 0h1v1h-1zM1 1h1v1h-1z');
  });
});
