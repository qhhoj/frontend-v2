import { ApiError } from '@/api/client';
import { lineCountOf, MAX_DIFF_LINES } from '@/lib/line-diff';

export type DiffSide = 'left' | 'right';
/** One side of the page: its detail and source queries. */
export interface DiffSideInput {
  isPending: boolean;
  /** The detail query's error, then the source query's (null or undefined when fine). */
  errors: readonly unknown[];
  source: string | undefined;
}
export type DiffViewState =
  | { kind: 'forbidden' | 'notFound' | 'error'; side: DiffSide }
  | { kind: 'loading' }
  | { kind: 'tooLong'; lineCount: number }
  | { kind: 'ready'; leftSource: string; rightSource: string };
type SideProblem = 'forbidden' | 'notFound' | 'error';

const SIDES: readonly DiffSide[] = ['left', 'right'];
/** A refusal says more than a missing submission, which says more than a failed load. */
const PROBLEM_ORDER: readonly SideProblem[] = ['forbidden', 'notFound', 'error'];

function problemOf(side: DiffSideInput): SideProblem | null {
  const error = side.errors.find((candidate) => candidate !== null && candidate !== undefined);
  if (error === undefined) return null;
  if (error instanceof ApiError && error.status === 403) return 'forbidden';
  if (error instanceof ApiError && error.status === 404) return 'notFound';
  return 'error';
}

function firstProblem(sides: Record<DiffSide, DiffSideInput>): DiffViewState | null {
  for (const kind of PROBLEM_ORDER)
    for (const side of SIDES) if (problemOf(sides[side]) === kind) return { kind, side };
  return null;
}

/** What the diff page shows for the state of its two sides. Identical sources are `ready`: the page checks the rows. */
export function diffViewState(sides: Record<DiffSide, DiffSideInput>): DiffViewState {
  const problem = firstProblem(sides);
  if (problem) return problem;
  const leftSource = sides.left.source;
  const rightSource = sides.right.source;
  if (leftSource === undefined || rightSource === undefined) return { kind: 'loading' };
  const lineCount = Math.max(lineCountOf(leftSource), lineCountOf(rightSource));
  if (lineCount > MAX_DIFF_LINES) return { kind: 'tooLong', lineCount };
  return { kind: 'ready', leftSource, rightSource };
}
