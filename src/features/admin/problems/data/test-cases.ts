import type {
  CaseType,
  JsonObject,
  ProblemData,
  ProblemDataBody,
  TestCase,
} from '@/api/types/problem-data';
import { translate } from '@/i18n';
import { FILE_NAME_MAX_LENGTH, GENERATOR_ARGS_MAX_LENGTH, MAX_CASE_ARGS_BYTES } from '../limits';
import type { FieldErrors } from '../../ui/admin-errors';
import { countChanges } from '../../ui/form/dirty-form';

export const ARCHIVE_PREVIEW_COUNT = 10;
/** What the mass-testcases permission raises the hard limit to. */
export const MASS_TESTCASE_LIMIT = 9999;

export type KeyedCase = TestCase & { key: number };

export interface DataForm {
  checker: ProblemData['checker'];
  checkerArgsText: string;
  grader: ProblemData['grader'];
  graderArgsText: string;
  outputPrefix: number | null;
  outputLimit: number | null;
  unicode: boolean;
  nobigmath: boolean;
  cases: KeyedCase[];
}

export interface ListWarning {
  kind: 'over-soft' | 'over-max' | 'unclosed-batch' | 'stray-end' | 'missing-file';
  index?: number;
  file?: string;
}

let nextKey = 1;
const keyed = (testCase: TestCase): KeyedCase => ({ ...testCase, key: nextKey++ });
/** The row as the backend sees it: the local key is not part of a test. */
export const caseBody = (row: KeyedCase): TestCase => ({
  type: row.type,
  input: row.input,
  output: row.output,
  points: row.points,
  isPretest: row.isPretest,
  generatorArgs: row.generatorArgs,
  checker: row.checker,
  checkerArgs: row.checkerArgs,
  outputPrefix: row.outputPrefix,
  outputLimit: row.outputLimit,
});
/** A JSON box's text for a stored object: empty for null. */
export const argsText = (args: JsonObject | null) => (args === null ? '' : JSON.stringify(args));

const blankCase = (type: CaseType): TestCase => ({
  type,
  input: '',
  output: '',
  points: type === 'E' ? null : 0,
  isPretest: false,
  generatorArgs: '',
  checker: '',
  checkerArgs: null,
  outputPrefix: null,
  outputLimit: null,
});

const isCount = (value: number | null) =>
  value === null || (Number.isSafeInteger(value) && value >= 0);
const fileNameOk = (name: string) => name.length <= FILE_NAME_MAX_LENGTH && !name.includes('\0');

/** The byte count the backend sums over every row: generator arguments and the JSON of the checker arguments (`null` is 4). */
export const argsBytes = (cases: KeyedCase[]) =>
  cases.reduce(
    (total, row) =>
      total + row.generatorArgs.length + JSON.stringify(row.checkerArgs ?? null).length,
    0,
  );

function caseErrors(row: KeyedCase, index: number): FieldErrors {
  const prefix = `cases.${index}`;
  const message = (key: string) => translate(`admin.problems.data.errors.${key}`);
  const errors: FieldErrors = {};
  if (!fileNameOk(row.input)) errors[`${prefix}.input`] = message('fileName');
  if (!fileNameOk(row.output)) errors[`${prefix}.output`] = message('fileName');
  if (row.generatorArgs.length > GENERATOR_ARGS_MAX_LENGTH)
    errors[`${prefix}.generatorArgs`] = message('generatorArgs');
  for (const field of ['points', 'outputPrefix', 'outputLimit'] as const)
    if (!isCount(row[field])) errors[`${prefix}.${field}`] = message('count');
  return errors;
}

/** The unsaved-change snapshot of a form: what a save would send, row keys left out. */
export const dataSnapshot = (form: DataForm) =>
  JSON.stringify({ ...form, cases: form.cases.map(caseBody) });

/** What a save would send, as a plain object: row keys left out, so two forms compare by their values. */
const sentShape = (form: DataForm) => JSON.parse(dataSnapshot(form)) as Record<string, unknown>;

/** A rule and its arguments are one choice (picking Testlib writes both), so each pair counts as one change. */
function pairedShape(form: DataForm): object {
  const { checkerArgsText, graderArgsText, checker, grader, ...rest } = sentShape(form);
  return { ...rest, checker: [checker, checkerArgsText], grader: [grader, graderArgsText] };
}
/** How many settings differ between two forms: the "2 thay đổi chưa lưu" count. */
export const countDataChanges = (current: DataForm, baseline: DataForm) =>
  countChanges(pairedShape(current), pairedShape(baseline));

export function toDataForm(data: ProblemData): DataForm {
  return {
    checker: data.checker,
    checkerArgsText: argsText(data.checkerArgs),
    grader: data.grader,
    graderArgsText: argsText(data.graderArgs),
    outputPrefix: data.outputPrefix,
    outputLimit: data.outputLimit,
    unicode: data.unicode,
    nobigmath: data.nobigmath,
    cases: data.cases.map(keyed),
  };
}

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An empty box is null, a JSON object is that object, anything else is `undefined` (refused). */
export function parseArgs(text: string): JsonObject | null | undefined {
  if (text.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isJsonObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Every refusal the backend would give for this form, keyed by field (`cases.<row>.<field>` for a test row). Shown live. */
export function checkDataForm(form: DataForm): FieldErrors {
  const errors: FieldErrors = {};
  if (parseArgs(form.checkerArgsText) === undefined)
    errors.checkerArgs = translate('admin.problems.data.badJson');
  if (parseArgs(form.graderArgsText) === undefined)
    errors.graderArgs = translate('admin.problems.data.badJson');
  for (const field of ['outputPrefix', 'outputLimit'] as const)
    if (!isCount(form[field])) errors[field] = translate('admin.problems.data.errors.count');
  form.cases.forEach((row, index) => Object.assign(errors, caseErrors(row, index)));
  if (argsBytes(form.cases) > MAX_CASE_ARGS_BYTES)
    errors.cases = translate('admin.problems.data.errors.argsTotal');
  return errors;
}

/** The request body for a form that passes `checkDataForm`; otherwise the same refusals. */
export function toDataBody(form: DataForm): { body: ProblemDataBody } | { errors: FieldErrors } {
  const errors = checkDataForm(form);
  if (Object.keys(errors).length > 0) return { errors };
  const checkerArgs = parseArgs(form.checkerArgsText) ?? null;
  const graderArgs = parseArgs(form.graderArgsText) ?? null;
  const body: ProblemDataBody = {
    checker: form.checker,
    checkerArgs,
    grader: form.grader,
    graderArgs,
    outputPrefix: form.outputPrefix,
    outputLimit: form.outputLimit,
    unicode: form.unicode,
    nobigmath: form.nobigmath,
    cases: form.cases.map(caseBody),
  };
  return { body };
}

export const addCase = (cases: KeyedCase[]) => [...cases, keyed(blankCase('C'))];
/** Single tests (`C`) for these file pairs, with these points, in order. */
export const casesFromPairs = (
  pairs: { input: string; output: string }[],
  points: number[],
): KeyedCase[] =>
  pairs.map((pair, index) =>
    keyed({
      ...blankCase('C'),
      input: pair.input,
      output: pair.output,
      points: points[index] ?? 0,
    }),
  );
export const addBatch = (cases: KeyedCase[]) => [
  ...cases,
  keyed(blankCase('S')),
  keyed(blankCase('C')),
  keyed(blankCase('E')),
];

/** One place up (`-1`) or down (`1`); a move past either end changes nothing. */
export function moveCase(cases: KeyedCase[], index: number, offset: -1 | 1): KeyedCase[] {
  const target = index + offset;
  if (target < 0 || target >= cases.length) return cases;
  const moved = [...cases];
  [moved[index], moved[target]] = [moved[target]!, moved[index]!];
  return moved;
}

export const removeCase = (cases: KeyedCase[], index: number): KeyedCase[] =>
  cases.filter((_row, position) => position !== index);

export const caseCount = (cases: TestCase[]) =>
  cases.filter((testCase) => testCase.type === 'C').length;

/** Batch structure: an `E` with no open `S` is stray, an `S` still open at the end is unclosed. */
function batchWarnings(cases: TestCase[]): ListWarning[] {
  const warnings: ListWarning[] = [];
  let openAt: number | null = null;
  cases.forEach((testCase, index) => {
    if (testCase.type === 'S') openAt = index;
    if (testCase.type !== 'E') return;
    if (openAt === null) warnings.push({ kind: 'stray-end', index });
    openAt = null;
  });
  return openAt === null ? warnings : [...warnings, { kind: 'unclosed-batch', index: openAt }];
}

/** A file missing from the archive is fine when a generator line makes it. */
function fileWarnings(cases: TestCase[], data: ProblemData): ListWarning[] {
  const files = new Set(data.archiveFiles);
  return cases.flatMap((testCase, index) => {
    if (testCase.type !== 'C') return [];
    const isGenerated = Boolean(data.generator && testCase.generatorArgs.trim());
    const missing = [testCase.input, testCase.output].find((file) => file && !files.has(file));
    return missing && !isGenerated ? [{ kind: 'missing-file', index, file: missing }] : [];
  });
}

/** The write guard counts every row, group markers included; the soft threshold is advice about real cases. */
function countWarnings(cases: TestCase[], data: ProblemData): ListWarning[] {
  if (cases.length > data.limits.maxCases) return [{ kind: 'over-max' }];
  return caseCount(cases) > data.limits.softCases ? [{ kind: 'over-soft' }] : [];
}

export function listWarnings(form: Pick<DataForm, 'cases'>, data: ProblemData): ListWarning[] {
  const structure = batchWarnings(form.cases);
  const stray = structure.filter((warning) => warning.kind === 'stray-end');
  const unclosed = structure.filter((warning) => warning.kind === 'unclosed-batch');
  return [
    ...stray,
    ...fileWarnings(form.cases, data),
    ...unclosed,
    ...countWarnings(form.cases, data),
  ];
}
