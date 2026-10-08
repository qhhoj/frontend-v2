import { describe, expect, it } from 'vitest';
import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it.each([
    ['minhthu@gmail.com', 'm***@gmail.com'],
    ['a@b.co', 'a***@b.co'],
    ['first.last@school.edu.vn', 'f***@school.edu.vn'],
  ])('keeps the first character and the domain of %s', (email, masked) => {
    expect(maskEmail(email)).toBe(masked);
  });

  it('leaves text without a local part as it is', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
    expect(maskEmail('@b.co')).toBe('@b.co');
  });
});
