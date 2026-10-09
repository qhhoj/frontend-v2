import { ApiError } from '@/api/client';
import type { NavigationBody, NavigationItem } from '@/api/types/site-admin';
import { translate } from '@/i18n';
import { adminIssueText, fieldErrorsOf, isConflict } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { isSafePath, regexProblem } from './nav-tree';

/** The dialog's fields; `parentId` is `''` for the top level. */
export interface NavForm {
  key: string;
  label: string;
  path: string;
  regex: string;
  parentId: string;
  order: number;
  hidden: boolean;
}

/** What the dialog sends: a create carries every field, an edit only the changed ones. */
export type NavSaveRequest =
  | { kind: 'create'; body: NavigationBody }
  | { kind: 'update'; id: string; body: Partial<NavigationBody> };

const LIMITS = { keyMax: 10, labelMax: 20, pathMax: 255, regexMax: 500, orderMax: 1_000_000 };

export function toNavForm(item: NavigationItem | null): NavForm {
  if (!item)
    return { key: '', label: '', path: '', regex: '', parentId: '', order: 0, hidden: false };
  return {
    key: item.key,
    label: item.label,
    path: item.path,
    regex: item.regex,
    parentId: item.parentId ?? '',
    order: item.order,
    hidden: item.hidden,
  };
}

const isWithin = (text: string, max: number) => text.length >= 1 && text.length <= max;

const keyError = ({ key }: NavForm) =>
  isWithin(key, LIMITS.keyMax) ? null : translate('admin.site.nav.errors.key');
const labelError = ({ label }: NavForm) =>
  isWithin(label, LIMITS.labelMax) ? null : translate('admin.site.nav.errors.label');
const pathError = ({ path }: NavForm) =>
  isSafePath(path) && path.length <= LIMITS.pathMax
    ? null
    : translate('admin.site.nav.errors.path');
const regexError = ({ regex }: NavForm) => {
  if (regex.length > LIMITS.regexMax) return translate('admin.site.nav.errors.regexTooLong');
  const problem = regexProblem(regex);
  return problem === null ? null : translate('admin.site.nav.regexInvalid', { message: problem });
};
const orderError = ({ order }: NavForm) =>
  Number.isInteger(order) && order >= 0 && order <= LIMITS.orderMax
    ? null
    : translate('admin.site.nav.errors.order');

const FIELD_CHECKS: [keyof NavForm, (form: NavForm) => string | null][] = [
  ['key', keyError],
  ['label', labelError],
  ['path', pathError],
  ['regex', regexError],
  ['order', orderError],
];

/** The problems found before any request: one text per field that has one. */
export function checkNavForm(form: NavForm): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, check] of FIELD_CHECKS) {
    const problem = check(form);
    if (problem !== null) errors[field] = problem;
  }
  return errors;
}

/** A create body: an empty parent is left out, so the entry goes to the top level. */
export function navBody(form: NavForm): NavigationBody {
  const body: NavigationBody = {
    key: form.key,
    label: form.label,
    path: form.path,
    regex: form.regex,
    hidden: form.hidden,
    order: form.order,
  };
  if (form.parentId !== '') body.parentId = form.parentId;
  return body;
}

const PLAIN_FIELDS = ['key', 'label', 'path', 'regex', 'order', 'hidden'] as const;

/** An edit body: only the fields that changed; an emptied parent is `null` (the top level). */
export function navPatch(before: NavForm, after: NavForm): Partial<NavigationBody> {
  const patch: Partial<NavigationBody> = {};
  for (const field of PLAIN_FIELDS) {
    if (before[field] !== after[field]) Object.assign(patch, { [field]: after[field] });
  }
  if (before.parentId !== after.parentId)
    patch.parentId = after.parentId === '' ? null : after.parentId;
  return patch;
}

export function navSaveRequest(item: NavigationItem | null, form: NavForm): NavSaveRequest {
  if (!item) return { kind: 'create', body: navBody(form) };
  return { kind: 'update', id: item.id, body: navPatch(toNavForm(item), form) };
}

/** Backend issue codes that have an SPA text, and the form field each one belongs under. */
const ISSUE_FIELDS: Record<string, { field: keyof NavForm; message: string }> = {
  invalid_path: { field: 'path', message: 'admin.site.nav.issues.invalid_path' },
  invalid_regex: { field: 'regex', message: 'admin.site.nav.issues.invalid_regex' },
  parent_unknown: { field: 'parentId', message: 'admin.site.nav.issues.parent_unknown' },
  parent_cycle: { field: 'parentId', message: 'admin.site.nav.issues.parent_cycle' },
};

/** A refused save as field texts: issue codes by lookup, a duplicate key (409 `fields.key`) as "Khoá đã có.". */
export function navIssueTexts(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  if (isConflict(error) && 'key' in error.fields)
    return { key: translate('admin.site.nav.issues.keyTaken') };
  if (error.issues.length > 0) {
    const texts: FieldErrors = {};
    for (const issue of error.issues) {
      const known = ISSUE_FIELDS[issue.code];
      if (known) texts[known.field] ??= translate(known.message);
      else texts[issue.field] ??= adminIssueText(issue);
    }
    return texts;
  }
  return fieldErrorsOf(error);
}
