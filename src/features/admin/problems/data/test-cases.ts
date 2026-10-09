import type {
  CaseType,
  JsonObject,
  ProblemData,
  ProblemDataBody,
  TestCase,
} from '@/api/types/problem-data';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';

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
const withoutKey = (row: KeyedCase): TestCase => {
  const testCase: Partial<KeyedCase> = { ...row };
  delete testCase.key;
  return testCase as TestCase;
};
/** A JSON box's text for a stored object: empty for null. */
export const argsText = (args: JsonObject | null) => (args === null ? '' : JSON.stringify(args));
/** A number box's value: empty is null. */
export const optionalNumber = (text: string) => (text.trim() === '' ? null : Number(text));

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

/** The PUT body, or the per-field refusals when a configuration box does not hold a JSON object. */
export function toDataBody(form: DataForm): { body: ProblemDataBody } | { errors: FieldErrors } {
  const checkerArgs = parseArgs(form.checkerArgsText);
  const graderArgs = parseArgs(form.graderArgsText);
  const errors: FieldErrors = {};
  if (checkerArgs === undefined) errors.checkerArgs = translate('admin.problems.data.badJson');
  if (graderArgs === undefined) errors.graderArgs = translate('admin.problems.data.badJson');
  if (Object.keys(errors).length > 0) return { errors };
  const body: ProblemDataBody = {
    checker: form.checker,
    checkerArgs: checkerArgs ?? null,
    grader: form.grader,
    graderArgs: graderArgs ?? null,
    outputPrefix: form.outputPrefix,
    outputLimit: form.outputLimit,
    unicode: form.unicode,
    nobigmath: form.nobigmath,
    cases: form.cases.map(withoutKey),
  };
  return { body };
}

export const addCase = (cases: KeyedCase[]) => [...cases, keyed(blankCase('C'))];
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
