import { ApiError } from '@/api/client';
import type { Ghost } from '@/api/types/contest-ghosts';
import { translate } from '@/i18n';

/** backend libs/contests ghost-types.ts GHOST_CSV_MAX_BYTES: the CSV body cap; UploadButton refuses larger files locally. */
export const GHOST_CSV_MAX_BYTES = 1_048_576;
/** A preview of up to 2000 rows shows this many; every unranked row is listed above it anyway. */
export const PREVIEW_ROW_LIMIT = 50;
/** The backend reports at most this many issues per refused import. */
export const MAX_REPORTED_ISSUES = 50;

const KNOWN_ROW_CODES = [
  'label_missing',
  'label_formula',
  'label_repeats',
  'label_invalid',
  'caption_invalid',
  'caption_formula',
  'control_character',
  'cell_invalid',
  'columns_mismatch',
  'header_invalid',
  'csv_invalid',
  'too_many_ghosts',
];

/**
 * One Vietnamese line per refused CSV issue ("Dòng 3: ..."; just the reason when the issue belongs to no row), built from
 * `code` and `row`, never the backend's English message. null when the failure is something else.
 */
export function refusedRowsOf(error: unknown): string[] | null {
  if (!(error instanceof ApiError) || error.code !== 'ghost_import_invalid') return null;
  return error.issues
    .filter((issue) => issue.field === 'csv')
    .map((issue) => {
      const code = KNOWN_ROW_CODES.includes(issue.code) ? issue.code : 'other';
      const reason = translate(`admin.ghosts.import.rowCodes.${code}`);
      return issue.row === undefined
        ? reason
        : translate('admin.ghosts.import.rowLine', { row: issue.row, reason });
    });
}

export const unrankedOf = (ghosts: readonly Ghost[]): Ghost[] =>
  ghosts.filter((ghost) => ghost.isUnranked);

/** "Xếp hạng", or why the server could not rank the row by the contest's format. */
export const ghostStatusKey = (ghost: Ghost): string =>
  ghost.gap ? `admin.ghosts.preview.gap.${ghost.gap}` : 'admin.ghosts.preview.ranked';
