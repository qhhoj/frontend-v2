/** The authenticator code is 6 digits (`CodeDto` allows 6-16 characters because scratch codes share the field). */
export const OTP_LENGTH = 6;

export interface OtpEdit {
  code: string;
  /** Box that gets focus next. */
  focus: number;
}

export const digitsOf = (text: string) => text.replace(/\D/g, '');

/** Scratch codes are 16 upper-case base32 characters; people type them with spaces or dashes, which the backend keeps. */
export const normalizeBackupCode = (text: string) => text.replace(/[\s-]/g, '').toUpperCase();

/**
 * Typing or pasting `text` into box `index` of a code that currently reads `code`. A code is always a run of digits
 * without gaps. A full-length paste replaces everything wherever it lands; a shorter one overwrites from the box it
 * lands in (or from the first empty box when that is earlier). Nothing but digits is ever accepted.
 */
export function enterDigits(code: string, index: number, text: string): OtpEdit | null {
  const digits = digitsOf(text);
  if (!digits) return null;
  if (digits.length >= OTP_LENGTH)
    return { code: digits.slice(0, OTP_LENGTH), focus: OTP_LENGTH - 1 };
  const start = Math.min(index, code.length);
  const next = (code.slice(0, start) + digits + code.slice(start + digits.length)).slice(
    0,
    OTP_LENGTH,
  );
  return { code: next, focus: Math.min(start + digits.length, OTP_LENGTH - 1) };
}

/** Clears the digit in box `index`, or the previous one when that box is empty; later digits shift left so there is no gap. */
export function eraseDigit(code: string, index: number): OtpEdit {
  const target = index < code.length ? index : index - 1;
  if (target < 0) return { code, focus: 0 };
  return { code: code.slice(0, target) + code.slice(target + 1), focus: target };
}
