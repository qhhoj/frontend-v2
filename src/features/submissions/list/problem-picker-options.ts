import type { ContestProblem } from '@/api/types/contests';

/** Where the filter's problem box takes its choices: a typed code (the whole site), or a scope's own problems. */
export type ProblemPickerSource =
  | { kind: 'code' }
  | { kind: 'contest'; problems: readonly ContestProblem[] }
  | { kind: 'organization'; slug: string };

export interface ProblemOption {
  /** null is "every problem" (the Select's placeholder value). */
  code: string | null;
  label: string;
}

/**
 * "Every problem" first, then the listed problems. A picked problem the list left out (a later search, a URL code)
 * keeps its row, so the box still names it.
 */
export function pickerOptions(input: {
  listed: readonly { code: string; label: string }[];
  picked: string;
  anyLabel: string;
}): ProblemOption[] {
  const { listed, picked, anyLabel } = input;
  const keepsPicked = picked !== '' && !listed.some((option) => option.code === picked);
  return [
    { code: null, label: anyLabel },
    ...(keepsPicked ? [{ code: picked, label: picked }] : []),
    ...listed,
  ];
}
