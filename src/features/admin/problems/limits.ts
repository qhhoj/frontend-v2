/**
 * Backend limits the client checks before a request (libs/problems file-sniff, problem-data DTO, core limits, statement text).
 * A check here only saves a round trip: the backend still decides, and its reason is shown when it refuses.
 */
const KIB = 1024;
const MIB = 1024 * KIB;

export const IMAGE_MAX_BYTES = 5 * MIB;
export const MAX_CASE_ARGS_BYTES = MIB;
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/svg+xml';
/** A file input's `accept` for the extensions the backend lists (without the dot), e.g. `.zip,.docx`. */
export const acceptOfExtensions = (extensions: readonly string[]): string =>
  extensions.map((extension) => `.${extension}`).join(',');

export const FILE_NAME_MAX_LENGTH = 100;
export const GENERATOR_ARGS_MAX_LENGTH = 1000;
export const STATEMENT_NAME_MAX_LENGTH = 100;
export const MARKDOWN_MAX_LENGTH = 200_000;

/** Legacy typographic characters a statement may not contain (backend `DISALLOWED_STATEMENT_CHARACTERS`). */
export const DISALLOWED_STATEMENT_CHARACTERS: readonly string[] = [
  '“',
  '”',
  '‘',
  '’',
  '−',
  'ﬀ',
  'ﬁ',
  'ﬂ',
  'ﬃ',
  'ﬄ',
];
