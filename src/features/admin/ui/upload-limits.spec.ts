import { describe, expect, it } from 'vitest';
import { UPLOAD_LIMITS, tooLargeFor } from './upload-limits';

describe('tooLargeFor', () => {
  it('accepts a file at the limit and refuses one byte more', () => {
    expect(tooLargeFor({ size: UPLOAD_LIMITS.statementPdf }, UPLOAD_LIMITS.statementPdf)).toBe(
      false,
    );
    expect(tooLargeFor({ size: UPLOAD_LIMITS.statementPdf + 1 }, UPLOAD_LIMITS.statementPdf)).toBe(
      true,
    );
  });
});
