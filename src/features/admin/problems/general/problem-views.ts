import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import { advancedChangeCount, pickFields } from '../../ui/form/editor-view';
import { emptyProblemForm } from './problem-form';
import type { ProblemForm } from './problem-form';

/** The Basic view of the general form ("Cơ bản"); every other field is in the Advanced view. */
export const PROBLEM_BASIC_FIELDS = [
  'code',
  'name',
  'timeLimit',
  'memoryLimit',
  'points',
  'isPublic',
] as const satisfies readonly (keyof ProblemForm)[];

/**
 * Not counted on the Advanced badge: set by the server or always filled (the creator as author, an organization problem's
 * members-only access, the type a problem must have, the publish date set on publishing).
 */
const UNCOUNTED: readonly (keyof ProblemForm)[] = [
  'authors',
  'organizations',
  'isOrganizationPrivate',
  'typeIds',
  'date',
];

const isCounted = (field: keyof ProblemForm) =>
  !(PROBLEM_BASIC_FIELDS as readonly string[]).includes(field) && !UNCOUNTED.includes(field);

/** The counted values; the allowed languages compare as a set. */
function advancedValues(form: ProblemForm, fields: readonly (keyof ProblemForm)[]): object {
  return { ...pickFields(form, fields), allowedLanguages: [...form.allowedLanguages].sort() };
}

/** The Advanced tab's badge: Advanced values off the new-problem defaults or not saved yet. */
export function problemAdvancedCount(
  form: ProblemForm,
  saved: ProblemForm,
  meta: ProblemEditingMeta,
): number {
  const defaults = emptyProblemForm(meta);
  const fields = (Object.keys(defaults) as (keyof ProblemForm)[]).filter(isCounted);
  return advancedChangeCount(
    advancedValues(form, fields),
    advancedValues(saved, fields),
    advancedValues(defaults, fields),
  );
}
