import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { optionsRefusalOf } from './polygon-options-refusal';

const refusal = (code: string, params?: Record<string, unknown>) =>
  optionsRefusalOf(new ApiError(code, 400, 'refused', { extra: params ? { params } : {} }));

describe('optionsRefusalOf', () => {
  it('puts each language refusal under its field, with the languages it names', () => {
    expect(refusal('statement_language_required', { languages: ['english', 'russian'] })).toEqual({
      field: 'main',
      text: 'Chọn đề chính trong số: english, russian.',
    });
    expect(refusal('statement_language_unmapped', { language: 'russian' })).toEqual({
      field: 'other:russian',
      text: 'Chọn ngôn ngữ trên QHHOJ hoặc Bỏ qua cho đề russian.',
    });
    expect(refusal('statement_language_repeated', { language: 'en' })?.field).toBe('others');
    expect(refusal('tutorial_language_required', { languages: ['a', 'b'] })?.field).toBe(
      'tutorial',
    );
  });

  it('gives the test limit refusal to the page line with both numbers', () => {
    expect(refusal('too_many_testcases', { count: 240, limit: 200 })).toEqual({
      field: null,
      text: 'Bài có 240 test, vượt giới hạn 200 test của bạn.',
    });
  });

  it('leaves other failures, and non-API errors, to the generic line', () => {
    expect(refusal('problem_code_taken')).toBeNull();
    expect(optionsRefusalOf(new Error('boom'))).toBeNull();
  });
});
