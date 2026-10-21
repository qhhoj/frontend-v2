import { describe, expect, it } from 'vitest';
import openapi from '@/api/generated/openapi.json';
import { i18n } from '@/i18n';
import { importErrorOf } from './polygon-import-errors';
import type { ImportErrorCode } from './polygon-import-errors';

const CODES = openapi.components.schemas.PolygonImportErrorCode.enum as ImportErrorCode[];

describe('importErrorOf', () => {
  it('has a Vietnamese and an English cause and fix for every code the backend sends', () => {
    const missing = CODES.flatMap((code) =>
      (['vi', 'en'] as const).flatMap((locale) =>
        ['title', 'fix']
          .map((part) => `admin.polygonErrors.${code}.${part}`)
          .filter((key) => !i18n.global.te(key, locale))
          .map((key) => `${locale}:${key}`),
      ),
    );
    expect(missing).toEqual([]);
  });

  it('puts the params into the text, a list joined', () => {
    expect(importErrorOf('statement_language_unmapped', { language: 'russian' })).toEqual({
      kind: 'options',
      title: 'Đề russian chưa được gán ngôn ngữ',
      fix: 'Chọn en, vi hoặc Bỏ qua cho đề russian.',
    });
    expect(
      importErrorOf('statement_language_required', { languages: ['english', 'russian'] }).fix,
    ).toBe('Gói có các đề english, russian. Chọn một đề làm đề chính.');
    expect(importErrorOf('too_many_testcases', { count: 120, limit: 100 }).title).toBe(
      'Bài có 120 test, quá giới hạn 100',
    );
  });

  it('tells which action helps: the options, the target, a retry, a sync, or none here', () => {
    const kinds = (
      [
        'tutorial_language_required',
        'problem_code_taken',
        'generation_no_judge',
        'imported_needs_attention',
        'checker_unsupported',
      ] as const
    ).map((code) => importErrorOf(code, null).kind);
    expect(kinds).toEqual(['options', 'target', 'transient', 'attention', 'other']);
  });

  it('reads a missing code or one this page does not know as an unexplained failure', () => {
    const unknown = {
      kind: 'other',
      title: 'Không nhập được',
      fix: 'Hệ thống không cho biết thêm lý do. Thử lại; nếu vẫn lỗi, báo quản trị viên.',
    };
    expect(importErrorOf(null, null)).toEqual(unknown);
    expect(importErrorOf('future_code' as ImportErrorCode, {})).toEqual(unknown);
  });
});
