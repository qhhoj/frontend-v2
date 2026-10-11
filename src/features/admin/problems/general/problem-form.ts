import type { RequiredPart } from '@/api/typed';
import type { OrganizationChip, UserChip } from '@/api/types/admin-common';
import type {
  EditableProblem,
  ProblemBody,
  ProblemEditingMeta,
  ProblemEditor,
  ProblemPatch,
  ResultVisibility,
  SourceVisibility,
  TestcaseVisibility,
  UserSummaryView,
} from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import { PROBLEM_CODE_PATTERN } from '../problem-code';

export const PROBLEM_LIMITS = {
  timeLimit: { min: 0.01, max: 60, highAbove: 5 },
  memoryLimit: { min: 0, max: 1_048_576 },
  points: { min: 800, max: 3500 },
} as const;

export interface LanguageLimitForm {
  languageId: string;
  timeLimit: number;
  memoryLimit: number;
}

export interface ProblemForm {
  code: string;
  name: string;
  source: string;
  summary: string;
  /** ISO instant (UTC); null = no date. */
  date: string | null;
  /** Image URL for link previews; '' = none. */
  ogImage: string;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  partial: boolean;
  languageLimits: LanguageLimitForm[];
  typeIds: string[];
  groupId: string;
  licenseId: string | null;
  allowedLanguages: string[];
  submissionSourceVisibility: SourceVisibility;
  testcaseVisibility: TestcaseVisibility;
  testcaseResultVisibility: ResultVisibility;
  allowViewFeedback: boolean;
  authors: UserChip[];
  curators: UserChip[];
  testers: UserChip[];
  bannedUsers: UserChip[];
  organizations: OrganizationChip[];
  isOrganizationPrivate: boolean;
  isPublic: boolean;
  isManuallyManaged: boolean;
  isFullMarkup: boolean;
}

const chipsOf = (users: UserSummaryView[]): UserChip[] =>
  users.map(({ id, username }) => ({ id, username }));

/** A language key from the detail becomes the language id the form and the DTO use. */
const limitsWithIds = (problem: EditableProblem, meta: ProblemEditingMeta): LanguageLimitForm[] =>
  problem.languageLimits.flatMap((limit) => {
    const language = meta.languages.find((candidate) => candidate.key === limit.language);
    return language
      ? [{ languageId: language.id, timeLimit: limit.timeLimit, memoryLimit: limit.memoryLimit }]
      : [];
  });

const basicsOf = (problem: EditableProblem, editor: ProblemEditor) => ({
  code: problem.code,
  name: editor.baseName,
  source: problem.source,
  summary: problem.summary,
  date: problem.date,
  ogImage: editor.ogImage,
});

const limitsOf = (problem: EditableProblem, meta: ProblemEditingMeta) => ({
  timeLimit: problem.timeLimit,
  memoryLimit: problem.memoryLimit,
  points: problem.points,
  partial: problem.partial,
  languageLimits: limitsWithIds(problem, meta),
});

const classOf = (editor: ProblemEditor) => ({
  typeIds: [...editor.typeIds],
  groupId: editor.groupId,
  licenseId: editor.licenseId,
  allowedLanguages: [...editor.allowedLanguageIds],
});

const visibilityOf = (problem: EditableProblem) => ({
  submissionSourceVisibility: problem.submissionSourceVisibility,
  testcaseVisibility: problem.testcaseVisibility,
  testcaseResultVisibility: problem.testcaseResultVisibility,
  allowViewFeedback: problem.allowViewFeedback,
});

const peopleOf = (problem: EditableProblem, editor: ProblemEditor) => ({
  authors: chipsOf(problem.authors),
  curators: chipsOf(editor.curators),
  testers: chipsOf(editor.testers),
  bannedUsers: chipsOf(editor.bannedUsers),
  organizations: editor.organizations.map((id) => ({ id, slug: null })),
});

const flagsOf = (problem: EditableProblem) => ({
  isOrganizationPrivate: problem.isOrganizationPrivate,
  isPublic: problem.isPublic,
  isManuallyManaged: problem.isManuallyManaged,
  isFullMarkup: problem.isFullMarkup,
});

/** The form as the detail stores it; the editor block is present for every editor (the page's gate). */
export function toProblemForm(problem: EditableProblem, meta: ProblemEditingMeta): ProblemForm {
  const editor = problem.editor!;
  return {
    ...basicsOf(problem, editor),
    ...limitsOf(problem, meta),
    ...classOf(editor),
    ...visibilityOf(problem),
    ...peopleOf(problem, editor),
    ...flagsOf(problem),
  };
}

/** The empty create form: the backend defaults a new problem gets when nothing is typed. */
export function emptyProblemForm(meta: ProblemEditingMeta): ProblemForm {
  return {
    code: '',
    name: '',
    source: '',
    summary: '',
    date: null,
    ogImage: '',
    timeLimit: 1,
    memoryLimit: 262144,
    points: 800,
    partial: true,
    languageLimits: [],
    typeIds: [],
    groupId: meta.groups[0]?.id ?? '',
    licenseId: null,
    allowedLanguages: meta.languages.map((language) => language.id),
    submissionSourceVisibility: 'F',
    testcaseVisibility: 'O',
    testcaseResultVisibility: 'A',
    allowViewFeedback: false,
    authors: [],
    curators: [],
    testers: [],
    bannedUsers: [],
    organizations: [],
    isOrganizationPrivate: false,
    isPublic: false,
    isManuallyManaged: false,
    isFullMarkup: false,
  };
}

/** A plain copy of the form: `structuredClone` cannot copy the reactive proxy a ref holds. The form is JSON data. */
export const cloneForm = (form: ProblemForm): ProblemForm =>
  JSON.parse(JSON.stringify(form)) as ProblemForm;

const idsOf = (chips: unknown) => (chips as { id: string }[]).map((chip) => chip.id);

/** How each form field becomes a DTO value: user chips become ids. */
const SEND: Partial<Record<keyof ProblemForm, (value: unknown) => unknown>> = {
  authors: idsOf,
  curators: idsOf,
  testers: idsOf,
  bannedUsers: idsOf,
  organizations: idsOf,
};
const toSent = (key: keyof ProblemForm, value: unknown): unknown => {
  const convert = SEND[key];
  return convert ? convert(value) : value;
};
const sameJson = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

/** The PATCH body: only fields whose value changed (omitted = unchanged on the backend). */
export function changedProblemFields(before: ProblemForm, after: ProblemForm): ProblemPatch {
  const patch: ProblemPatch = {};
  for (const key of Object.keys(after) as (keyof ProblemForm)[]) {
    if (sameJson(before[key], after[key])) continue;
    const sent = toSent(key, after[key]);
    Object.assign(patch, { [key]: sent });
  }
  return patch;
}

const isEmptyValue = (value: unknown) =>
  value === '' || value === null || (Array.isArray(value) && value.length === 0);

/**
 * backend `STAFF_FIELDS` (problem editing): a write that changes one of these needs `judge.edit_all_problem`, so a plain
 * `judge.add_problem` or `judge.suggest_new_problem` account gets a 403 for the whole create if the body carries one.
 */
export const STAFF_ONLY_FIELDS = [
  'authors',
  'curators',
  'bannedUsers',
  'licenseId',
  'summary',
  'ogImage',
  'allowedLanguages',
  'organizations',
  'isOrganizationPrivate',
  'testcaseResultVisibility',
  'allowViewFeedback',
  'date',
] as const satisfies readonly (keyof ProblemForm)[];

const isStaffOnly = (key: keyof ProblemForm) =>
  (STAFF_ONLY_FIELDS as readonly string[]).includes(key);

/** A staff-only field goes out only for a viewer who may write it, and only when it differs from the empty form. */
const isSentOnCreate = (
  key: keyof ProblemForm,
  form: ProblemForm,
  defaults: ProblemForm,
  canEditAll: boolean,
) => !isStaffOnly(key) || (canEditAll && !sameJson(form[key], defaults[key]));

/**
 * The POST body: required fields always, optional ones only when filled. A staff-only field is sent only for a viewer who may
 * write it AND only when it differs from `defaults`, so an untouched allowed-languages list leaves the backend default.
 */
export function toProblemBody(
  form: ProblemForm,
  canEditAll: boolean,
  defaults: ProblemForm,
): ProblemBody {
  const optional: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof ProblemForm)[]) {
    if (!isSentOnCreate(key, form, defaults, canEditAll)) continue;
    const sent = toSent(key, form[key]);
    if (!isEmptyValue(sent) || key === 'typeIds') optional[key] = sent;
  }
  return { ...optional, ...requiredProblemFields(form) };
}

/** Typed from the generated body: a required member the backend adds is a compile error here until it is listed. */
const requiredProblemFields = (form: ProblemForm): RequiredPart<ProblemBody> => ({
  code: form.code,
  groupId: form.groupId,
  memoryLimit: form.memoryLimit,
  name: form.name,
  points: form.points,
  timeLimit: form.timeLimit,
  typeIds: form.typeIds,
});

const outOf = (value: number, range: { min: number; max: number }) =>
  value < range.min || value > range.max;

function timeLimitError(
  form: ProblemForm,
  can: (permission: string) => boolean,
): string | undefined {
  if (outOf(form.timeLimit, PROBLEM_LIMITS.timeLimit))
    return translate('admin.problems.general.errors.timeLimit');
  const isHighTime = form.timeLimit > PROBLEM_LIMITS.timeLimit.highAbove;
  if (isHighTime && !can('judge.high_problem_timelimit'))
    return translate('admin.problems.general.errors.highTime');
  return undefined;
}

/** A per-language limit above the plain-editor cap needs the same permission as the main one (the backend checks both). */
function languageTimeErrors(form: ProblemForm, can: (permission: string) => boolean): FieldErrors {
  if (can('judge.high_problem_timelimit')) return {};
  const errors: FieldErrors = {};
  form.languageLimits.forEach((limit, index) => {
    if (limit.timeLimit > PROBLEM_LIMITS.timeLimit.highAbove)
      errors[`languageLimits.${index}.timeLimit`] = translate(
        'admin.problems.general.errors.highTime',
      );
  });
  return errors;
}

/** Checks a form before any request: the messages the page shows under each field. */
export function checkProblemForm(
  form: ProblemForm,
  can: (permission: string) => boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!PROBLEM_CODE_PATTERN.test(form.code))
    errors.code = translate('admin.problems.general.errors.code');
  const timeError = timeLimitError(form, can);
  if (timeError) errors.timeLimit = timeError;
  Object.assign(errors, languageTimeErrors(form, can));
  if (outOf(form.memoryLimit, PROBLEM_LIMITS.memoryLimit))
    errors.memoryLimit = translate('admin.problems.general.errors.memory');
  if (outOf(form.points, PROBLEM_LIMITS.points))
    errors.points = translate('admin.problems.general.errors.points');
  if (form.typeIds.length === 0) errors.typeIds = translate('admin.problems.general.errors.types');
  return errors;
}
