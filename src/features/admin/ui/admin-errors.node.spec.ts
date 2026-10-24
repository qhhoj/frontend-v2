import { afterEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { i18n } from '@/i18n';
import {
  adminIssueText,
  failureTextOf,
  fieldErrorsOf,
  formatWait,
  isConflict,
  isNotFound,
  readRefusal,
} from './admin-errors';
import { IMPORT_REFUSALS } from './refusal-catalog';

afterEach(() => {
  i18n.global.locale.value = 'vi';
});

describe('fieldErrorsOf', () => {
  it('turns issues into one text per field, with the SPA text when it has one', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {
      issues: [
        { field: 'timeLimit', code: 'max', message: 'timeLimit must not be greater than 60' },
        { field: 'problems.2.points', code: 'whatever_new', message: 'points too big' },
      ],
    });
    expect(fieldErrorsOf(error)).toEqual({
      timeLimit: 'Giá trị quá lớn.',
      'problems.2.points': 'Giá trị này chưa hợp lệ.',
    });
  });

  it('leaves out issues that name no field, so the refusal shows as the page line (429, 403, 409)', () => {
    const error = new ApiError('rate_limited', 429, 'Too many attempts', {
      issues: [{ field: '', code: 'rate_limited', message: 'Too many attempts; try again later' }],
    });
    expect(fieldErrorsOf(error)).toEqual({});
    expect(failureTextOf(error)).toBe('Bạn thao tác quá nhanh. Hãy thử lại sau.');
  });

  it('falls back to the fields map when the backend sent no issues (the reserved ban reason)', () => {
    const error = new ApiError('validation_failed', 400, 'Reserved ban reason', {
      fields: { reason: ['Reserved for automatic contest-cheating bans.', 'second'] },
    });
    expect(fieldErrorsOf(error)).toEqual({
      reason: 'Lý do này dành riêng cho các vụ cấm tự động do gian lận trong kỳ thi.',
    });
  });

  it('keeps the first issue of a field and ignores anything that is not an ApiError', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {
      issues: [
        { field: 'code', code: 'matches', message: 'a' },
        { field: 'code', code: 'max_length', message: 'b' },
      ],
    });
    expect(fieldErrorsOf(error)).toEqual({ code: 'Định dạng chưa đúng.' });
    expect(fieldErrorsOf(new Error('x'))).toEqual({});
  });

  it('words a failed write by its code and adds the wait when the refusal said how long', () => {
    expect(failureTextOf(new ApiError('rate_limited', 429, 'x'))).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(failureTextOf(new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 42 }))).toBe(
      'Bạn thao tác quá nhanh. Thử lại sau 42 giây.',
    );
  });

  it('words the wait as seconds, minutes, or hours and minutes, rounding minutes up', () => {
    expect(formatWait(45)).toBe('45 giây');
    expect(formatWait(2557)).toBe('43 phút');
    expect(formatWait(3600)).toBe('1 giờ');
    expect(formatWait(3900)).toBe('1 giờ 5 phút');
    expect(failureTextOf(new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 2557 }))).toBe(
      'Bạn thao tác quá nhanh. Thử lại sau 43 phút.',
    );
  });
});

describe('isNotFound', () => {
  it('is true for the backend not_found code, which every record 404 carries', () => {
    expect(isNotFound(new ApiError('not_found', 404, 'No such problem'))).toBe(true);
  });

  it('is false for a 404 that is not a missing record, for other statuses and for non-API errors', () => {
    expect(isNotFound(new ApiError('not_in_contest', 404, 'You are not in this contest.'))).toBe(
      false,
    );
    expect(isNotFound(new ApiError('forbidden', 403, 'No'))).toBe(false);
    expect(isNotFound(new ApiError('network_error', 0, 'Network error'))).toBe(false);
    expect(isNotFound(new Error('not_found'))).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });
});

describe('isConflict', () => {
  it('is true for a 409 whatever its code, since participation refusals use their own codes', () => {
    expect(isConflict(new ApiError('conflict', 409, 'A page with this url exists'))).toBe(true);
    expect(isConflict(new ApiError('already_registered', 409, 'Registered'))).toBe(true);
  });

  it('is false for other statuses and for non-API errors', () => {
    expect(isConflict(new ApiError('not_found', 404, 'No'))).toBe(false);
    const busy = new ApiError('conflict', 409, 'Busy', {
      issues: [{ field: 'lock', code: 'busy', message: 'Busy' }],
    });
    expect(isConflict(busy)).toBe(false);
    expect(failureTextOf(busy)).toBe('Đang có thao tác khác chạy; hãy chờ xong rồi thử lại.');
    expect(isConflict(new ApiError('conflict', 400, 'Odd'))).toBe(false);
    expect(isConflict(new Error('409'))).toBe(false);
    expect(isConflict(undefined)).toBe(false);
  });
});

describe('quota_exceeded', () => {
  const refusal = (details: unknown) =>
    new ApiError('quota_exceeded', 403, 'The organization has no credits left', {
      issues: [
        {
          field: 'credits',
          code: 'quota_exceeded',
          message: 'The organization has no credits left',
        },
      ],
      extra: { details },
    });
  const GENERIC = 'Tổ chức đã hết hạn mức. Liên hệ quản trị để tăng hạn mức.';

  it('names the credits needed, left and used', () => {
    expect(failureTextOf(refusal({ meter: 'credits', limit: 200, used: 194, needed: 10 }))).toBe(
      'Vượt hạn mức tín dụng của tổ chức: cần 10, còn lại 6 (đã dùng 194 / 200). Liên hệ quản trị để tăng hạn mức.',
    );
  });

  it('writes storage in MiB and never a negative "left"', () => {
    const text = failureTextOf(
      refusal({
        meter: 'storage',
        limit: 512 * 1048576,
        used: 600 * 1048576,
        needed: 25 * 1048576,
      }),
    );
    expect(text).toContain('cần 25 MiB, còn lại 0 MiB (đã dùng 600 MiB / 512 MiB)');
  });

  it('falls back to the generic quota text when the details are missing or malformed', () => {
    expect(failureTextOf(refusal(undefined))).toBe(GENERIC);
    expect(failureTextOf(refusal({ meter: 'time', limit: 1, used: 1, needed: 1 }))).toBe(GENERIC);
  });
});

const issue = (code: string, message: string, field = 'name') => ({ field, code, message });

describe('adminIssueText (no raw English in the Vietnamese UI)', () => {
  it('uses the SPA text of the issue code', () => {
    expect(adminIssueText(issue('admin_cap', 'x'))).toBe('Mỗi người quản trị tối đa 3 tổ chức.');
  });
  it('maps a codeless English refusal by its message', () => {
    expect(adminIssueText(issue('', 'Slug is taken.', 'slug'))).toBe('Đường dẫn (slug) này đã có.');
    expect(adminIssueText(issue('', 'Unknown user.', 'user'))).toBe('Không có người dùng này.');
    expect(adminIssueText(issue('', 'Every assignee must be an active user', 'assignee'))).toBe(
      'Mọi người xử lý phải là tài khoản đang hoạt động.',
    );
  });
  it('names the column of a CSV refusal', () => {
    expect(adminIssueText(issue('', 'Missing the Full Name column', 'file'))).toBe(
      'Tệp thiếu cột Full Name.',
    );
  });
  it('falls back to a Vietnamese line for an unknown refusal, and shows the server text only in English', () => {
    const unknown = issue('brand_new', 'username must be shorter than or equal to 150 characters');
    expect(adminIssueText(unknown)).toBe('Giá trị này chưa hợp lệ.');
    i18n.global.locale.value = 'en';
    expect(adminIssueText(unknown)).toBe(
      'username must be shorter than or equal to 150 characters',
    );
  });
});

describe('failureTextOf names the reason an issue gives', () => {
  it('shows an issue on no field (the org admin cap) instead of the generic line', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {
      issues: [issue('admin_cap', 'The admin has 3 organizations', '')],
    });
    expect(failureTextOf(error)).toBe('Mỗi người quản trị tối đa 3 tổ chức.');
  });
  it('shows the specific reason of a codeless refusal (the test generator)', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {
      issues: [
        issue('', 'The judge does not run test generators; delete the generator.', 'generator'),
      ],
    });
    expect(failureTextOf(error)).toBe('Máy chấm không chạy bộ sinh test; hãy xóa bộ sinh test.');
  });
  it('keeps the usual line when the issues only say a value is off', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {
      issues: [issue('is_length', 'name must be longer')],
    });
    expect(failureTextOf(error)).toBe('Dữ liệu chưa hợp lệ.');
  });
  it('words a participation clash by its code', () => {
    expect(failureTextOf(new ApiError('already_participating', 409, 'x'))).toBe(
      'Người này đã có lượt tham gia đang diễn ra trong kỳ thi.',
    );
  });
});

describe('readRefusal', () => {
  const refused = (code: string, status: number, issues: ReturnType<typeof issue>[], extra = {}) =>
    new ApiError(code, status, 'x', { issues, ...extra });

  it('R1: a reason on a rendered path is the field text and leaves no page line', () => {
    const taken = refused('conflict', 409, [issue('key_taken', 'This key is taken.', 'key')]);
    expect(readRefusal(taken, { paths: ['key'] })).toEqual({
      fields: { key: 'Khóa này đã có.' },
      line: null,
    });
    expect(readRefusal(taken).line).toBe('Khóa này đã có.');
  });

  it('R3: an alias names the rendered path (a bulk row on the username box)', () => {
    const error = refused('validation_failed', 400, [issue('max_length', 'm', 'users.0.username')]);
    const read = readRefusal(error, {
      paths: ['username'],
      aliases: { 'users.*.username': 'username' },
    });
    expect(read).toEqual({ fields: { username: 'Quá dài.' }, line: null });
  });

  it('R4: a pattern matches one segment, and the longest rendered ancestor takes the rest', () => {
    const error = refused('validation_failed', 400, [
      issue('max_length', 'm', 'cases.2.input'),
      issue('max', 'm', 'organizations.0'),
      issue('max', 'm', 'cases.2.input.deep.too'),
    ]);
    const read = readRefusal(error, { paths: ['cases.*.input', 'organizations'] });
    expect(read.fields).toEqual({
      'cases.2.input': 'Quá dài.',
      organizations: 'Giá trị quá lớn.',
    });
    expect(read.line).toBeNull();
  });

  it('R5: two reasons on one path show the first', () => {
    const error = refused('validation_failed', 400, [
      issue('matches', 'a', 'code'),
      issue('max_length', 'b', 'code'),
    ]);
    expect(readRefusal(error, { paths: ['code'] }).fields).toEqual({
      code: 'Định dạng chưa đúng.',
    });
  });

  it('R6: unrouted specific and generic reasons make one line, each text once', () => {
    const error = refused('validation_failed', 400, [
      issue('admin_cap', 'x', ''),
      issue('admin_cap', 'x', 'organizations'),
      issue('max', 'y', 'points'),
    ]);
    expect(readRefusal(error).line).toBe(
      'Mỗi người quản trị tối đa 3 tổ chức. Dữ liệu chưa hợp lệ.',
    );
    expect(readRefusal(error, { paths: ['organizations'] }).line).toBe(
      'Mỗi người quản trị tối đa 3 tổ chức. Dữ liệu chưa hợp lệ.',
    );
  });

  it('R9: the import pages word the rate limit through the catalog, and a wait is appended to other refusals', () => {
    const limited = new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 42 });
    expect(readRefusal(limited, { catalog: IMPORT_REFUSALS }).line).toBe(
      'Tối đa 10 lượt nhập mỗi giờ. Thử lại sau 42 giây.',
    );
    expect(readRefusal(new ApiError('conflict', 409, 'x', { retryAfterSeconds: 5 })).line).toMatch(
      / Thử lại sau 5 giây\.$/u,
    );
  });

  it('R10: a Polygon options refusal sits under its field, else on the line with the language names', () => {
    const error = new ApiError('statement_language_unmapped', 400, 'x', {
      extra: { params: { language: 'russian' } },
    });
    expect(readRefusal(error, { paths: ['other:russian'] })).toEqual({
      fields: { 'other:russian': 'Chọn ngôn ngữ trên QHHOJ hoặc Bỏ qua cho đề russian.' },
      line: null,
    });
    const required = new ApiError('statement_language_required', 400, 'x', {
      extra: { params: { languages: ['english', 'russian'] } },
    });
    expect(readRefusal(required).line).toBe('Chọn đề chính trong số: english, russian.');
  });
});
