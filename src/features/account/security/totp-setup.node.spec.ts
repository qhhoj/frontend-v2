import { describe, expect, it } from 'vitest';
import { scratchCodesText } from './totp-setup';

describe('totp setup text', () => {
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
