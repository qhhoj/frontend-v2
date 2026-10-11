import type { CreatedUser, NewUserRow } from '@/api/types/users-admin';

/** One CSV record per line; quoted fields may hold commas and doubled quotes (no line breaks inside a field). */
function splitRecord(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (quoted && char === '"' && line[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      fields.push(field);
      field = '';
    } else field += char;
  }
  fields.push(field);
  return fields.map((value) => value.trim());
}

/** Header names accepted per field (legacy `batchadduser` used `username,fullname`). */
const COLUMNS = {
  username: ['username'],
  fullName: ['fullname', 'full_name', 'name'],
  email: ['email'],
  password: ['password'],
  invite: ['invite'],
} as const;
const YES = new Set(['1', 'true', 'yes', 'x', 'có']);

export interface ParsedUsers {
  rows: NewUserRow[];
  /** `missingUsername` when the header has no `username` column. */
  problem: 'missingUsername' | null;
}

/** Rows from a CSV with a header line; blank lines and lines of bare separators (Excel's trailing `,,,,`) are skipped, empty cells are absent fields. Pure. */
export function parseUserCsv(text: string): ParsedUsers {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((line) => splitRecord(line).some((cell) => cell.trim() !== ''));
  const header = splitRecord(lines[0] ?? '').map((name) => name.toLowerCase());
  const indexOf = (names: readonly string[]) => header.findIndex((name) => names.includes(name));
  const columns = Object.fromEntries(
    Object.entries(COLUMNS).map(([field, names]) => [field, indexOf(names)]),
  ) as Record<keyof typeof COLUMNS, number>;
  if (columns.username < 0) return { rows: [], problem: 'missingUsername' };
  const rows = lines.slice(1).map((line) => {
    const cells = splitRecord(line);
    const cell = (field: keyof typeof COLUMNS) =>
      (columns[field] >= 0 ? cells[columns[field]] : '') ?? '';
    const row: NewUserRow = { username: cell('username') };
    if (cell('fullName')) row.fullName = cell('fullName');
    if (cell('email')) row.email = cell('email');
    if (cell('password')) row.password = cell('password');
    if (YES.has(cell('invite').toLowerCase())) row.invite = true;
    return row;
  });
  return { rows, problem: null };
}

const quote = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/** The results as CSV, for printing the generated passwords (legacy `batchadduser` output). */
export const resultsCsv = (results: readonly CreatedUser[]): string =>
  [
    'username,status,password,issues',
    ...results.map((row) =>
      [
        row.username,
        row.status,
        row.generatedPassword ?? '',
        row.issues.map((issue) => issue.code).join(' '),
      ]
        .map(quote)
        .join(','),
    ),
  ].join('\n');
