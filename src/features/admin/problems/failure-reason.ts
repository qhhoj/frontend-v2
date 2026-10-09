import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { adminIssueText, failureTextOf } from '../ui/admin-errors';

/**
 * The backend's file refusals (`rejectFile`, zip reader) carry no issue code, only their English message. Each known message
 * maps to its Vietnamese text here; anything else gets the generic text, never the English. Backend ask: issue codes on file refusals.
 */
const EXACT_REFUSALS = new Map<string, string>([
  ['Unexpected, repeated or oversized field.', 'unexpectedField'],
  ['Send exactly one file in the "file" field.', 'oneFile'],
  ['The upload is malformed.', 'malformed'],
  ['A file is required.', 'fileRequired'],
  ['A non-empty file is required.', 'emptyFile'],
  ['The SVG is too large or too complex.', 'svgTooLarge'],
  ['Only JPG, PNG, GIF and SVG images are accepted.', 'imageType'],
  ['The statement must be a PDF file.', 'pdfOnly'],
  ['This file type is not allowed as problem material.', 'materialType'],
  ['The archive must be a .zip file.', 'zipOnly'],
  ['The package has no problem.xml at its root.', 'noProblemXml'],
  ['Archive central directory is inconsistent.', 'zipInconsistent'],
  ['The archive is not a valid zip file.', 'zipInvalid'],
  ['The archive points outside itself.', 'zipOutside'],
]);

interface PatternRefusal {
  pattern: RegExp;
  key: string;
  params: (match: RegExpExecArray) => Record<string, string>;
}

/** Messages that carry a file or extension name. The zip library's detail is dropped: the key's text says what happened. */
const PATTERN_REFUSALS: PatternRefusal[] = [
  {
    pattern: /^The name (.+) is already used by another data file\.$/,
    key: 'duplicateName',
    params: (match) => ({ name: match[1]! }),
  },
  {
    pattern: /^Allowed extensions for (generator|customChecker|customGrader|customHeader): (.+)$/,
    key: 'extensions',
    params: (match) => ({
      kind: translate(`admin.problems.uploads.sources.${match[1]}`),
      list: match[2]!,
    }),
  },
  {
    pattern: /^The archive is not a valid zip file: .+$/,
    key: 'zipInvalid',
    params: () => ({}),
  },
  {
    pattern: /^(.+) is corrupt: .+$/,
    key: 'corruptEntry',
    params: (match) => ({ name: match[1]! }),
  },
  {
    pattern: /^(.+) does not match its declared size$/,
    key: 'sizeMismatch',
    params: (match) => ({ name: match[1]! }),
  },
  {
    pattern: /^(.+) is too large to read$/,
    key: 'tooLargeToRead',
    params: (match) => ({ name: match[1]! }),
  },
  {
    pattern: /^No such file in the archive: (.+)$/,
    key: 'noSuchEntry',
    params: (match) => ({ name: match[1]! }),
  },
  {
    pattern: /^Cannot read (.+): .+$/,
    key: 'cannotRead',
    params: (match) => ({ name: match[1]! }),
  },
];

const refusalText = (key: string, params: Record<string, string> = {}) =>
  translate(`admin.problems.refusals.${key}`, params);

/** The Vietnamese text of a backend file refusal: exact message first, then the patterns, then the generic text. */
export function refusalTextOf(message: string): string {
  const key = EXACT_REFUSALS.get(message);
  if (key) return refusalText(key);
  for (const refusal of PATTERN_REFUSALS) {
    const match = refusal.pattern.exec(message);
    if (match) return refusalText(refusal.key, refusal.params(match));
  }
  return refusalText('unknown');
}

/**
 * The line for a failed write. A `validation_failed` names what failed: an issue shows the SPA text for its code, a field
 * shows its refusal in Vietnamese (`refusalTextOf`). Anything else gets the usual text.
 */
export function failureReasonOf(error: unknown): string {
  if (error instanceof ApiError && error.code === 'validation_failed') {
    const [issue] = error.issues;
    // The backend derives an `invalid` issue from every `fields` entry, so a file refusal arrives with both: the field's message wins.
    const issueText = issue ? adminIssueText(issue) : undefined;
    if (issue && issueText !== undefined && issueText !== issue.message) return issueText;
    const [message] = Object.values(error.fields).flat();
    if (message !== undefined) return refusalTextOf(message);
    if (issue) return refusalText('unknown');
  }
  return failureTextOf(error);
}
