import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { formatScratchCode, groupSecret, rateLimitWaitText, scratchCodesText } from './totp-setup';

describe('totp setup text', () => {
  it('groups the setup key in fours for typing by hand', () => {
    expect(groupSecret('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP')).toBe(
      'JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP',
    );
  });

  it('prints a backup code in dashed groups of four', () => {
    expect(formatScratchCode('K7QM2XRA9PTD4WLE')).toBe('K7QM-2XRA-9PTD-4WLE');
  });

  it('writes the file as a header line, a blank line, then one code per line', () => {
    expect(
      scratchCodesText(['K7QM2XRA9PTD4WLE', 'H3ZN8CVB5YJF1MSU'], 'minhthu').split('\n'),
    ).toEqual([
      'QHHOJ - mã dự phòng của minhthu. Mỗi mã dùng được một lần.',
      '',
      'K7QM-2XRA-9PTD-4WLE',
      'H3ZN-8CVB-5YJF-1MSU',
      '',
    ]);
  });
});

describe('rateLimitWaitText', () => {
  it('names the wait a 429 sent in Retry-After', () => {
    const limited = new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 42 });
    expect(rateLimitWaitText(limited)).toBe('Bạn thử quá nhiều lần. Thử lại sau 42 giây.');
  });

  it('is null when a 429 sent no wait, and for any other failure', () => {
    expect(rateLimitWaitText(new ApiError('rate_limited', 429, 'x'))).toBeNull();
    expect(rateLimitWaitText(new ApiError('invalid_code', 400, 'x', { retryAfterSeconds: 42 }))).toBeNull();
    expect(rateLimitWaitText(new Error('boom'))).toBeNull();
  });
});
