import type { Checker, Grader, JsonObject } from '@/api/types/problem-data';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import { argsText, parseArgs } from './test-cases';
import type { DataForm } from './test-cases';

/**
 * The checker and grader controls edit the form's JSON argument boxes (`checkerArgsText`, `graderArgsText`) key by key, so
 * keys they do not show (a migrated checker's `files`/`lang`) go back unchanged. Rules match the backend's `checker-args.ts`.
 */

/** Built-in checkers, in the order the picker lists them. */
export const STOCK_CHECKERS = [
  'standard',
  'floats',
  'floatsabs',
  'floatsrel',
  'identical',
  'linecount',
  'rstripped',
  'sorted',
  'unordered',
  'easy',
  'linematches',
] as const satisfies readonly Checker[];

/** A teacher's own checker: `bridged` with one of these `type`s. */
export const CUSTOM_KINDS = ['testlib', 'themis', 'default'] as const;
export type CustomKind = (typeof CUSTOM_KINDS)[number];
export type CheckerFamily = 'stock' | CustomKind;

export const FLOAT_CHECKERS: readonly Checker[] = ['floats', 'floatsabs', 'floatsrel'];
export const DEFAULT_PRECISION = 6;
export const MAX_PRECISION = 20;

/** The args box as an object; a box that is not a JSON object reads as empty. */
export const argsOf = (text: string): JsonObject => parseArgs(text) ?? {};

/** The box text with `key` set, or removed when `value` is undefined; an empty object is an empty box. */
export function withArg(text: string, key: string, value: unknown): string {
  const args = { ...argsOf(text) };
  if (value === undefined) delete args[key];
  else args[key] = value;
  return argsText(Object.keys(args).length ? args : null);
}

export function familyOf(form: Pick<DataForm, 'checker' | 'checkerArgsText'>): CheckerFamily {
  if (form.checker !== 'bridged') return 'stock';
  const type = argsOf(form.checkerArgsText).type ?? 'testlib';
  return (CUSTOM_KINDS as readonly unknown[]).includes(type) ? (type as CustomKind) : 'testlib';
}

/**
 * Switching family: a custom kind keeps a custom checker's other keys and drops the percentage flag outside testlib;
 * going back to built-in picks `standard` with no arguments.
 */
export function setFamily(form: DataForm, family: CheckerFamily): void {
  if (family === 'stock') {
    form.checker = 'standard';
    form.checkerArgsText = '';
    return;
  }
  const keep = form.checker === 'bridged' ? form.checkerArgsText : '';
  form.checker = 'bridged';
  let text = withArg(keep, 'type', family);
  if (family !== 'testlib') text = withArg(text, 'treat_checker_points_as_percentage', undefined);
  form.checkerArgsText = text;
}

/** A new built-in checker starts without arguments (each takes different ones). */
export function setStockChecker(form: DataForm, checker: Checker): void {
  if (checker === form.checker) return;
  form.checker = checker;
  form.checkerArgsText = '';
}

/** The weights box: whole numbers separated by spaces or commas; null when the text is not that. */
export function parseWeights(text: string): number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (!parts.length || !parts.every((part) => /^\d+$/.test(part))) return null;
  return parts.map(Number);
}

/** Box and file I/O names the judge accepts: plain, not hidden, not one of the names the judge keeps. */
const RESERVED_NAMES = new Set(['input', 'output', 'main']);
export const isPlainFileName = (name: string) =>
  name !== '' && !name.startsWith('.') && !/[/\\]/.test(name) && !RESERVED_NAMES.has(name);

export const usesFileIo = (form: Pick<DataForm, 'grader' | 'graderArgsText'>) =>
  form.grader === 'standard' && argsOf(form.graderArgsText).io_method === 'file';

/** Switching grader drops arguments the new one does not read (file I/O belongs to `standard`, `allow_main` to `signature`). */
export function setGrader(form: DataForm, grader: Grader): void {
  if (grader === form.grader) return;
  form.grader = grader;
  form.graderArgsText = '';
}

const message = (key: string, values: Record<string, unknown> = {}) =>
  translate(`admin.problems.data.config.errors.${key}`, values);

function checkerErrors(form: DataForm): FieldErrors {
  const args = argsOf(form.checkerArgsText);
  if (FLOAT_CHECKERS.includes(form.checker) && args.precision !== undefined) {
    const precision = args.precision;
    if (
      !Number.isInteger(precision) ||
      (precision as number) < 0 ||
      (precision as number) > MAX_PRECISION
    )
      return { 'checkerArgs.precision': message('precision', { max: MAX_PRECISION }) };
  }
  if (form.checker === 'linematches' && args.point_distribution !== undefined) {
    const weights = args.point_distribution;
    if (!Array.isArray(weights) || !weights.some((weight) => (weight as number) > 0))
      return { 'checkerArgs.point_distribution': message('weights') };
  }
  return {};
}

function fileIoErrors(form: DataForm): FieldErrors {
  if (!usesFileIo(form)) return {};
  const args = argsOf(form.graderArgsText);
  const errors: FieldErrors = {};
  for (const key of ['io_input_file', 'io_output_file'] as const) {
    const name = typeof args[key] === 'string' ? args[key] : '';
    if (!isPlainFileName(name)) errors[`graderArgs.${key}`] = message('fileName');
  }
  return errors;
}

/** The checker and grader settings a save would be refused for, keyed by the control that shows them. */
export function configErrors(form: DataForm): FieldErrors {
  return { ...checkerErrors(form), ...fileIoErrors(form) };
}
