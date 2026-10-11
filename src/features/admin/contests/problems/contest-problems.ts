import type { ContestProblemBody, EditableContest, LabelStyle } from '@/api/types/contest-editing';

export const MAX_CONTEST_PROBLEMS = 100;
export const DEFAULT_PROBLEM_POINTS = 100;
/** backend `PROBLEM_LIMITS.points.max`: a row's points are a whole number in 0 to this. */
export const MAX_PROBLEM_POINTS = 3500;

/** A cleared box is '' (`v-model.number` keeps the text), which is not a number: it is refused here, never sent. */
export const isPointsValid = (points: unknown): boolean =>
  typeof points === 'number' &&
  Number.isInteger(points) &&
  points >= 0 &&
  points <= MAX_PROBLEM_POINTS;

export interface ProblemRow {
  problemId: string;
  code: string;
  name: string;
  points: number;
  partial: boolean;
  isPretested: boolean;
  /** The stored override (`settings.problemOutputPrefixes`); null = none, the judge default. */
  outputPrefix: number | null;
  maxSubmissions: number | null;
}

export const toProblemRows = (contest: EditableContest): ProblemRow[] => {
  const stored = new Map(
    (contest.settings?.problemOutputPrefixes ?? []).map((entry) => [
      entry.problemId,
      entry.outputPrefixOverride,
    ]),
  );
  return (contest.problems ?? []).map((problem) => ({
    problemId: problem.problemId,
    code: problem.code,
    name: problem.name,
    points: problem.points,
    partial: problem.partial,
    isPretested: problem.isPretested,
    outputPrefix: stored.get(problem.problemId) ?? null,
    maxSubmissions: problem.maxSubmissions,
  }));
};

/** A problem found by code, added at the end with the default points and no flags or caps. */
export const newProblemRow = (problem: { id: string; code: string; name: string }): ProblemRow => ({
  problemId: problem.id,
  code: problem.code,
  name: problem.name,
  points: DEFAULT_PROBLEM_POINTS,
  partial: true,
  isPretested: false,
  outputPrefix: null,
  maxSubmissions: null,
});

/** `alpha`: A…Z, then AA, AB… (spreadsheet columns); `numeric`: 1, 2… */
export function labelFor(index: number, style: LabelStyle): string {
  if (style === 'numeric') return String(index + 1);
  let label = '';
  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26))
    label = String.fromCharCode(65 + ((rest - 1) % 26)) + label;
  return label;
}

export function moveRow(rows: ProblemRow[], index: number, delta: -1 | 1): ProblemRow[] {
  const target = index + delta;
  if (target < 0 || target >= rows.length) return rows;
  const moved = [...rows];
  [moved[index], moved[target]] = [moved[target]!, moved[index]!];
  return moved;
}

export const toProblemsBody = (rows: ProblemRow[]): ContestProblemBody[] =>
  rows.map((row) => ({
    problem: row.problemId,
    points: row.points,
    partial: row.partial,
    isPretested: row.isPretested,
    maxSubmissions: row.maxSubmissions,
    ...(row.outputPrefix === null ? {} : { outputPrefixOverride: row.outputPrefix }),
  }));

/** The row at `from` moved to `to` (both 0-based, `to` clamped into the list); the others keep their order. */
export function moveRowTo(rows: ProblemRow[], from: number, to: number): ProblemRow[] {
  const target = Math.min(Math.max(to, 0), rows.length - 1);
  if (from === target || !rows[from]) return rows;
  const moved = rows.filter((_row, position) => position !== from);
  moved.splice(target, 0, rows[from]);
  return moved;
}

/** The same points on every row in `problemIds`. */
export const withPoints = (rows: ProblemRow[], problemIds: string[], points: number) =>
  rows.map((row) => (problemIds.includes(row.problemId) ? { ...row, points } : row));

/**
 * `incoming` (another contest's rows) appended after `rows`, settings and all: a problem already listed is
 * skipped, and nothing goes past the 100-problem cap.
 */
export function mergeRows(rows: ProblemRow[], incoming: ProblemRow[]) {
  const listed = new Set(rows.map((row) => row.problemId));
  const fresh = incoming.filter((row) => !listed.has(row.problemId));
  const added = fresh.slice(0, Math.max(MAX_CONTEST_PROBLEMS - rows.length, 0));
  return {
    rows: [...rows, ...added],
    added: added.length,
    skipped: incoming.length - added.length,
  };
}
