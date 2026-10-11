import type { FieldErrors } from '../admin-errors';
import { isSameValue } from './dirty-form';

/**
 * An editor form split in two views: "Cơ bản" (the few fields most problems/contests need) and "Nâng cao" (the rest).
 * Each form lists its Basic field names; every other field is Advanced. One save bar saves both views.
 */
export type EditorView = 'basic' | 'advanced';

/** The URL query key that keeps the view (`?view=advanced`); Basic is the default and leaves it out. */
export const VIEW_QUERY_KEY = 'view';

export const viewOfQuery = (value: unknown): EditorView =>
  value === 'advanced' ? 'advanced' : 'basic';

/** An error key's view: `formatConfig.penalty` and `languageLimits.0.timeLimit` go by their first segment. */
export const viewOfField = (field: string, basicFields: readonly string[]): EditorView =>
  basicFields.includes(field.split('.')[0]!) ? 'basic' : 'advanced';

/** The views that hold at least one error. */
export function viewsWithErrors(errors: FieldErrors, basicFields: readonly string[]): EditorView[] {
  const views = new Set(Object.keys(errors).map((field) => viewOfField(field, basicFields)));
  return (['basic', 'advanced'] as const).filter((view) => views.has(view));
}

/**
 * The view to show after a failed save: the other view when only it holds errors, so no refusal stays out of sight;
 * otherwise the current one.
 */
export function viewToReveal(current: EditorView, errorViews: readonly EditorView[]): EditorView {
  return errorViews.length > 0 && !errorViews.includes(current) ? errorViews[0]! : current;
}

/**
 * The Advanced tab's badge: how many of its values differ from the defaults or from the last save. Each argument is the
 * same projection of a form (only the Advanced values, keyed by field), so a field counts once.
 */
export function advancedChangeCount(current: object, saved: object, defaults: object): number {
  const now = current as Record<string, unknown>;
  const seed = saved as Record<string, unknown>;
  const base = defaults as Record<string, unknown>;
  return Object.keys(now).filter(
    (key) => !isSameValue(now[key], base[key]) || !isSameValue(now[key], seed[key]),
  ).length;
}

/** The named fields of a form, as a plain object: the projection `advancedChangeCount` compares. */
export function pickFields<T extends object>(form: T, fields: readonly (keyof T)[]): object {
  return Object.fromEntries(fields.map((field) => [field, form[field]]));
}
