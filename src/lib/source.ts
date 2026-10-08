import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import type { Language } from '@/api/types/problems';
import { errorMessageKey } from '@/i18n/error-message';

/** backend: libs/database MAX_SOURCE_LENGTH, counted in code points (`IsSourceLength`). */
export const MAX_SOURCE_LENGTH = 65_536;
/** A UTF-8 file of valid source is at most four bytes per code point. */
const MAX_SOURCE_BYTES = MAX_SOURCE_LENGTH * 4;
const SURROGATE_PAIR = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

export const codePointCount = (text: string) =>
  text.length - (text.match(SURROGATE_PAIR)?.length ?? 0);

export type SourceFileResult =
  { ok: true; text: string } | { ok: false; reason: 'tooLarge' | 'notText' | 'tooLong' };

export async function readSourceFile(file: File): Promise<SourceFileResult> {
  if (file.size > MAX_SOURCE_BYTES) return { ok: false, reason: 'tooLarge' };
  const text = await file.text();
  if (text.includes('\u0000')) return { ok: false, reason: 'notText' };
  if (codePointCount(text) > MAX_SOURCE_LENGTH) return { ok: false, reason: 'tooLong' };
  return { ok: true, text };
}

const BYTES_PER_MEGABYTE = 1024 * 1024;
/** backend: libs/common bootstrap.ts MAX_UPLOAD_BYTES; the server clamps every language's cap to it. */
const MAX_UPLOAD_BYTES = 20 * BYTES_PER_MEGABYTE;
const dotless = (extension: string) => extension.replace(/^\./, '').toLowerCase();
/** Like the server's `extensionOf`: the text after the last dot, lowercase; a name that is only `.sb3` has none. */
const extensionOfName = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/** The `accept` attribute value for a file-only language. */
export const acceptedExtension = ({ extension }: Pick<Language, 'extension'>) =>
  `.${dotless(extension)}`;

/** `fileSizeLimit` is in MB and 0 means uploads are off (B17); 0 here too. */
export const uploadCapBytes = ({ fileSizeLimit }: Pick<Language, 'fileSizeLimit'>) =>
  fileSizeLimit > 0 ? Math.min(fileSizeLimit * BYTES_PER_MEGABYTE, MAX_UPLOAD_BYTES) : 0;

export type UploadCheck =
  { ok: true } | { ok: false; reason: 'uploadDisabled' | 'wrongExtension' | 'empty' | 'tooLarge' };

/** Client-side mirror of what the server refuses (same order), so a doomed upload never leaves the browser. */
export function checkUploadFile(
  file: File,
  language: Pick<Language, 'extension' | 'fileSizeLimit'>,
): UploadCheck {
  const cap = uploadCapBytes(language);
  if (cap === 0) return { ok: false, reason: 'uploadDisabled' };
  if (extensionOfName(file.name) !== dotless(language.extension))
    return { ok: false, reason: 'wrongExtension' };
  if (file.size === 0) return { ok: false, reason: 'empty' };
  if (file.size > cap) return { ok: false, reason: 'tooLarge' };
  return { ok: true };
}

/** `<field>.<issue code>` of the submit routes (B10) to a message. A code the table does not know falls through to the top-level code. */
const ISSUE_KEYS: Readonly<Record<string, string>> = {
  'file.file_wrong_extension': 'submit.errors.fileWrongExtension',
  'file.scratch_project_invalid': 'submit.errors.scratchInvalid',
  'file.invalid': 'submit.errors.fileRejected',
  'language.file_upload_disabled': 'submit.errors.fileUploadDisabled',
  'language.language_extension_invalid': 'submit.errors.languageBroken',
  'language.language_takes_file': 'submit.errors.languageTakesFile',
  'language.language_takes_text': 'submit.errors.languageTakesText',
  'language.invalid': 'submit.errors.languageNotAllowed',
  'language.is_uuid': 'submit.errors.languageNotAllowed',
  'source.is_source_length': 'submit.errors.sourceLength',
};
const issueKey = ({ field, code }: FieldIssue) => ISSUE_KEYS[`${field}.${code}`];

/**
 * The one place a refused submit (text or file) becomes a message: issue codes first, then the distinct top-level codes
 * (B9: `banned_from_problem`, `contest_submission_limit`, `unfinished_submission_limit`, `rate_limited`, `conflict`,
 * `file_too_large`) through `errors.<code>`. A new backend code needs a row here or an `errors.*` message, nothing else.
 */
export function submitErrorKey(error: unknown): { key: string; params?: Record<string, unknown> } {
  if (!(error instanceof ApiError)) return { key: 'errors.generic' };
  for (const issue of error.issues) {
    const key = issueKey(issue);
    if (key)
      return key === ISSUE_KEYS['source.is_source_length']
        ? { key, params: { max: MAX_SOURCE_LENGTH } }
        : { key };
  }
  if (error.code === 'not_found') return { key: 'submit.errors.problemGone' };
  return { key: errorMessageKey(error) };
}
