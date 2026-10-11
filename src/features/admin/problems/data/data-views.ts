import type { JsonObject } from '@/api/types/problem-data';
import { advancedChangeCount } from '../../ui/form/editor-view';
import { argsOf, familyOf } from './checker-config';
import { caseBody } from './test-cases';
import type { DataForm } from './test-cases';

/** Error keys shown in the Basic view: the file names of file input/output (`graderArgs.io_input_file`). */
export const DATA_BASIC_FIELDS = ['graderArgs'] as const;

/** The checker and grader argument keys the Advanced view edits; others (a custom checker's `type`, file I/O) are Basic or hidden. */
const CHECKER_OPTION_KEYS = [
  'precision',
  'split_on',
  'point_distribution',
  'pe_allowed',
  'filter_new_line',
  'filler_lines_required',
  'treat_checker_points_as_percentage',
];
const GRADER_OPTION_KEYS = ['allow_main'];

const pickArgs = (text: string, keys: readonly string[]): JsonObject => {
  const args = argsOf(text);
  return Object.fromEntries(keys.filter((key) => key in args).map((key) => [key, args[key]]));
};

/** The values the Advanced view edits, each in the shape it is compared in. */
function advancedValues(form: DataForm) {
  return {
    rule: familyOf(form) === 'stock' ? form.checker : 'standard',
    checkerOptions: pickArgs(form.checkerArgsText, CHECKER_OPTION_KEYS),
    grader: form.grader,
    graderOptions: pickArgs(form.graderArgsText, GRADER_OPTION_KEYS),
    outputLimit: form.outputLimit,
    outputPrefix: form.outputPrefix,
    unicode: form.unicode,
    nobigmath: form.nobigmath,
    cases: form.cases.map(caseBody),
  };
}

const DEFAULT_VALUES = {
  rule: 'standard',
  checkerOptions: {},
  grader: 'standard',
  graderOptions: {},
  outputLimit: null,
  outputPrefix: null,
  unicode: false,
  nobigmath: false,
};

/**
 * The Advanced tab's badge: options off their default or not saved yet. The test list counts only when it is not saved
 * (every problem has tests, so "not the default" would always hold).
 */
export function dataAdvancedCount(form: DataForm, saved: DataForm): number {
  const current = advancedValues(form);
  return advancedChangeCount(current, advancedValues(saved), {
    ...DEFAULT_VALUES,
    cases: current.cases,
  });
}
