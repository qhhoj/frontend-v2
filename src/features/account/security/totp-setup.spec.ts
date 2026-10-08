import { describe, expect, it } from 'vitest';
import { formatScratchCode, groupSecret, scratchCodesText } from './totp-setup';

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
