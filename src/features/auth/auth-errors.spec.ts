import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { i18n } from '@/i18n';
import {
  authErrorText,
  banReason,
  fieldErrorTexts,
  hiddenIssueTexts,
  queryErrorText,
} from './auth-errors';

const banned = (extra: Record<string, unknown> = {}) =>
  new ApiError('banned', 403, 'This account has been banned. Reason: from the message', { extra });
const rejected = (issues: FieldIssue[], fields: Record<string, string[]> = {}) =>
  new ApiError('validation_failed', 400, 'Registration rejected', { fields, issues });
const issue = (field: string, code: string, message: string): FieldIssue => ({
  field,
  code,
  message,
});

describe('banReason', () => {
  it('reads the structured member and never the English message', () => {
    expect(banReason(banned({ banReason: 'cheating in R41' }))).toBe('cheating in R41');
  });

  it.each([
    ['a blank reason', banned({ banReason: '  ' })],
    ['no member (the message still says Reason:)', banned()],
    ['a member that is not text', banned({ banReason: 7 })],
    ['another code', new ApiError('forbidden', 403, 'x', { extra: { banReason: 'r' } })],
    ['not an ApiError', new Error('Reason: x')],
  ])('is null for %s', (_name, error) => {
    expect(banReason(error)).toBeNull();
  });
});

describe('authErrorText', () => {
  it('shows the ban reason in the interface language', () => {
    const error = banned({ banReason: 'cheating' });
    expect(authErrorText(error)).toBe('Tài khoản đã bị khoá. Lý do: cheating');
    i18n.global.locale.value = 'en';
    expect(authErrorText(error)).toBe('This account is banned. Reason: cheating');
  });

  it('shows the plain ban message when no reason came with it', () => {
    expect(authErrorText(banned())).toBe('Tài khoản đã bị khoá.');
  });

  it('translates by code and falls back to the generic message', () => {
    expect(authErrorText(new ApiError('invalid_code', 400, 'x'))).toBe('Mã sai hoặc đã hết hạn.');
    expect(authErrorText(new ApiError('never_heard_of_it', 500, 'x'))).toBe(
      'Đã có lỗi xảy ra. Hãy thử lại.',
    );
  });

  it.each(['NotAllowedError', 'InvalidStateError', 'SecurityError', 'NotSupportedError'])(
    'explains a failed browser security-key prompt (%s)',
    (name) => {
      expect(authErrorText(new DOMException('blocked', name))).toBe(
        'Xác minh khoá bảo mật không thành công.',
      );
    },
  );

  it('does not blame the key for a cancelled request (AbortError)', () => {
    expect(authErrorText(new DOMException('cancelled', 'AbortError'))).toBe(
      'Đã có lỗi xảy ra. Hãy thử lại.',
    );
  });

  it.each([
    [
      'a 401 invalid_credentials',
      new ApiError('invalid_credentials', 401, 'x'),
      'Sai tên đăng nhập hoặc mật khẩu.',
    ],
    ['a network_error', new ApiError('network_error', 0, 'x'), 'Không kết nối được máy chủ.'],
  ])('translates %s by its code', (_name, error, text) => {
    expect(authErrorText(error)).toBe(text);
  });
});

describe('authErrorText and the 429 wait', () => {
  it('says how long to wait when a 429 names its Retry-After', () => {
    const limited = new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 42 });
    expect(authErrorText(limited)).toBe('Bạn thử quá nhiều lần. Thử lại sau 42 giây.');
  });

  it('falls back to the code text for a 429 with no wait, and for a wait on any other status', () => {
    expect(authErrorText(new ApiError('rate_limited', 429, 'x'))).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(
      authErrorText(new ApiError('invalid_code', 400, 'x', { retryAfterSeconds: 42 })),
    ).not.toContain('42');
  });
});

describe('fieldErrorTexts', () => {
  it('translates each issue by its code and joins several per field', () => {
    const error = rejected([
      issue('username', 'username_taken', 'Username is taken.'),
      issue('email', 'email_taken', 'Email is already registered.'),
      issue('password', 'password_too_short', 'Password must be at least 8 characters.'),
      issue('password', 'password_pwned', 'This password has appeared in a data breach.'),
    ]);
    expect(fieldErrorTexts(error)).toEqual({
      username: 'Tên đăng nhập đã được dùng.',
      email: 'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
      password:
        'Mật khẩu phải có ít nhất 8 ký tự. Mật khẩu này từng bị lộ trong một vụ rò rỉ dữ liệu.',
    });
  });

  it('tells a taken username from a taken email by their codes, not by wording', () => {
    const texts = fieldErrorTexts(
      rejected([issue('username', 'username_taken', 'x'), issue('email', 'email_taken', 'x')]),
    );
    expect(texts.username).not.toBe(texts.email);
  });

  it('translates the school and language refusals', () => {
    const texts = fieldErrorTexts(
      rejected([
        issue('organizationId', 'organization_unavailable', 'x'),
        issue('languageId', 'language_unknown', 'x'),
      ]),
    );
    expect(texts.organizationId).toContain('Trường này không nhận thành viên mới');
    expect(texts.languageId).toContain('ngôn ngữ');
  });

  it('keeps the backend message for a code it has no text for', () => {
    const error = rejected([
      issue('username', 'max_length', 'username must be shorter than or equal to 30 characters'),
    ]);
    expect(fieldErrorTexts(error)).toEqual({
      username: 'username must be shorter than or equal to 30 characters',
    });
  });

  it('reads the reset email, whose issue carries only the constraint name (ask A1)', () => {
    const error = rejected([issue('email', 'matches', 'Enter a valid email address.')]);
    expect(fieldErrorTexts(error)).toEqual({ email: 'Nhập một địa chỉ email hợp lệ.' });
  });

  it('falls back to the fields of an answer without issues', () => {
    const error = rejected([], { username: ['Username is taken.', 'Too long.'] });
    expect(fieldErrorTexts(error)).toEqual({ username: 'Username is taken. Too long.' });
  });

  it('is empty for errors without fields or issues', () => {
    expect(fieldErrorTexts(new ApiError('rate_limited', 429, 'x'))).toEqual({});
    expect(fieldErrorTexts(null)).toEqual({});
  });

  it('does not let a field named like a prototype member break the result', () => {
    const texts = fieldErrorTexts(rejected([issue('__proto__', 'username_taken', 'x')]));
    expect(Object.keys(texts)).toEqual(['__proto__']);
  });
});

describe('hiddenIssueTexts', () => {
  it('returns the translated texts of known issues on fields the form does not show', () => {
    const error = rejected([
      issue('username', 'username_taken', 'x'),
      issue('email', 'email_taken', 'x'),
    ]);
    expect(hiddenIssueTexts(error, ['username'])).toEqual([
      'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
    ]);
  });

  it('skips unknown codes, whose English message is not worth a summary line', () => {
    expect(hiddenIssueTexts(rejected([issue('token', 'max_length', 'too long')]), [])).toEqual([]);
  });
});

describe('queryErrorText', () => {
  it('shows the codes the OAuth callback sends', () => {
    expect(queryErrorText('oauth_failed')).toBe('Đăng nhập bằng mạng xã hội không thành công.');
    expect(queryErrorText('email_unverified')).toContain('chưa được xác minh');
    expect(queryErrorText('account_not_activated')).toContain('chưa được kích hoạt');
  });

  it('shows the ban notice for the banned callback code', () => {
    expect(queryErrorText('banned')).toBe('Tài khoản đã bị khoá.');
  });

  it.each(['unknown', '__proto__', 'toString', '', ['oauth_failed'], undefined, 7])(
    'shows nothing for %j',
    (value) => {
      expect(queryErrorText(value)).toBeNull();
    },
  );
});
