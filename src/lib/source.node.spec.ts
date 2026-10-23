import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import {
  MAX_SOURCE_LENGTH,
  checkUploadFile,
  codePointCount,
  normalizeNewlines,
  readSourceFile,
  sourceLineCount,
  submitErrorKey,
} from './source';

const MEGABYTE = 1024 * 1024;

describe('sourceLineCount', () => {
  it('numbers no phantom line after a final newline, and keeps a blank line the author typed', () => {
    expect(sourceLineCount('int main() {}\n')).toBe(1);
    expect(sourceLineCount('int main() {}')).toBe(1);
    expect(sourceLineCount('a\n\n')).toBe(2);
    expect(sourceLineCount('')).toBe(1);
  });
});

describe('codePointCount', () => {
  it('accepts exactly the maximum and no more', () => {
    expect(codePointCount('😀'.repeat(MAX_SOURCE_LENGTH))).toBe(MAX_SOURCE_LENGTH);
    expect(codePointCount('x'.repeat(MAX_SOURCE_LENGTH) + 'y')).toBe(MAX_SOURCE_LENGTH + 1);
  });
});

describe('normalizeNewlines', () => {
  it('turns CRLF and a lone CR into LF and leaves everything else as it was', () => {
    expect(normalizeNewlines('a\r\nb\rc\n\n  d\t\r')).toBe('a\nb\nc\n\n  d\t\n');
    expect(normalizeNewlines('\r\r\n')).toBe('\n\n');
    expect(normalizeNewlines('no newline ')).toBe('no newline ');
  });
});

describe('readSourceFile', () => {
  const lines = ['#include <cstdio>', 'int main() {', '  return 0;', '}', ''];
  const bytesFile = (bytes: number[] | Uint8Array) => new File([new Uint8Array(bytes)], 'a.cpp');
  const utf16 = (text: string, littleEndian: boolean) => {
    const bytes = new Uint8Array(2 + text.length * 2);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, 0xfeff, littleEndian);
    for (let at = 0; at < text.length; at++)
      view.setUint16(2 + at * 2, text.charCodeAt(at), littleEndian);
    return bytes;
  };
  const expected = { ok: true, text: lines.join('\n') };

  it.each([
    ['CRLF', '\r\n'],
    ['a lone CR (classic Mac)', '\r'],
    ['LF', '\n'],
  ])('reads %s line endings as one line per line, each ending in LF', async (_name, ending) => {
    const result = await readSourceFile(new File([lines.join(ending)], 'a.cpp'));
    expect(result).toEqual(expected);
    expect(result.ok && sourceLineCount(result.text)).toBe(4);
  });
  it('drops a UTF-8 byte order mark and keeps non-ASCII text', async () => {
    const body = [...new TextEncoder().encode('// xin chào\r\nint x;')];
    expect(await readSourceFile(bytesFile([0xef, 0xbb, 0xbf, ...body]))).toEqual({
      ok: true,
      text: '// xin chào\nint x;',
    });
  });
  it.each([
    ['little', true],
    ['big', false],
  ])('decodes UTF-16 %s-endian with a byte order mark', async (_name, littleEndian) => {
    const text = `// chào 😀\r\n${lines.join('\r')}`;
    expect(await readSourceFile(bytesFile(utf16(text, littleEndian)))).toEqual({
      ok: true,
      text: `// chào 😀\n${lines.join('\n')}`,
    });
  });
  it('rejects an empty file so the editor keeps its text', async () => {
    expect(await readSourceFile(new File([], 'a.py'))).toEqual({ ok: false, reason: 'empty' });
  });
  it('rejects a binary file', async () => {
    const result = await readSourceFile(new File([new Uint8Array([1, 0, 2])], 'a.bin'));
    expect(result).toEqual({ ok: false, reason: 'notText' });
  });
  it('rejects a file too big to be a valid source before reading it', async () => {
    const big = new File([new Uint8Array(MAX_SOURCE_LENGTH * 4 + 1)], 'big.txt');
    expect(await readSourceFile(big)).toEqual({ ok: false, reason: 'tooLarge' });
  });
  it('rejects text over the code point limit', async () => {
    const text = 'x'.repeat(MAX_SOURCE_LENGTH + 1);
    expect(await readSourceFile(new File([text], 'a.txt'))).toEqual({
      ok: false,
      reason: 'tooLong',
    });
  });
});

describe('checkUploadFile', () => {
  const scratch = { extension: 'sb3', fileSizeLimit: 5 };
  const megabytes = (count: number) => new File([new Uint8Array(count * MEGABYTE)], 'p.sb3');

  it('accepts the language extension in any case and a file under the cap', () => {
    expect(checkUploadFile(new File(['x'], 'Cat.SB3'), scratch)).toEqual({ ok: true });
  });
  it('refuses every upload while the language has no upload size (0 means uploads are off, as on the server)', () => {
    expect(
      checkUploadFile(new File(['x'], 'cat.sb3'), { extension: 'sb3', fileSizeLimit: 0 }),
    ).toEqual({
      ok: false,
      reason: 'uploadDisabled',
    });
  });
  it('rejects another extension, an empty file and a file over the cap', () => {
    expect(checkUploadFile(new File(['x'], 'cat.zip'), scratch)).toEqual({
      ok: false,
      reason: 'wrongExtension',
    });
    expect(checkUploadFile(new File([], 'cat.sb3'), scratch)).toEqual({
      ok: false,
      reason: 'empty',
    });
    expect(checkUploadFile(megabytes(6), scratch)).toEqual({ ok: false, reason: 'tooLarge' });
  });
  it('accepts exactly the cap and clamps a huge declared cap to the 20 MB the server accepts', () => {
    expect(checkUploadFile(megabytes(5), scratch)).toEqual({ ok: true });
    expect(checkUploadFile(megabytes(20), { extension: 'sb3', fileSizeLimit: 50 })).toEqual({
      ok: true,
    });
    expect(checkUploadFile(megabytes(21), { extension: 'sb3', fileSizeLimit: 50 })).toEqual({
      ok: false,
      reason: 'tooLarge',
    });
  });
});

describe('submitErrorKey', () => {
  const issueOf = (field: string, code: string): FieldIssue => ({
    field,
    code,
    message: 'English text',
  });
  const refusal = (code: string, status: number, ...issues: FieldIssue[]) =>
    new ApiError(code, status, 'English text', { issues });

  it('maps each field issue the submit routes can send to its own message, by code and never by the English text', () => {
    const cases: Array<[FieldIssue, string]> = [
      [issueOf('file', 'file_wrong_extension'), 'submit.errors.fileWrongExtension'],
      [issueOf('file', 'scratch_project_invalid'), 'submit.errors.scratchInvalid'],
      [issueOf('file', 'invalid'), 'submit.errors.fileRejected'],
      [issueOf('language', 'file_upload_disabled'), 'submit.errors.fileUploadDisabled'],
      [issueOf('language', 'language_extension_invalid'), 'submit.errors.languageBroken'],
      [issueOf('language', 'language_takes_file'), 'submit.errors.languageTakesFile'],
      [issueOf('language', 'language_takes_text'), 'submit.errors.languageTakesText'],
      [issueOf('language', 'invalid'), 'submit.errors.languageNotAllowed'],
      [issueOf('language', 'is_uuid'), 'submit.errors.languageNotAllowed'],
    ];
    for (const [issue, key] of cases)
      expect(
        submitErrorKey(refusal('validation_failed', 400, issue)).key,
        `${issue.field} ${issue.code}`,
      ).toBe(key);
  });
  it('falls back to the generic message for an unknown code, an unknown issue and a non-API error', () => {
    expect(submitErrorKey(refusal('brand_new', 400)).key).toBe('errors.generic');
    expect(
      submitErrorKey(refusal('validation_failed', 400, issueOf('source', 'brand_new'))).key,
    ).toBe('errors.validation_failed');
    expect(submitErrorKey(new Error('boom')).key).toBe('errors.generic');
  });
});
