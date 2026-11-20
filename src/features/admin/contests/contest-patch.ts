import type { RequiredPart } from '@/api/typed';
import type { UserChip } from '@/api/types/admin-common';
import type { ContestBody, ContestPatch } from '@/api/types/contest-editing';
import type { ContestForm } from './contest-form';

// What a save sends: the changed fields of an edit (PATCH), or the filled fields of a create (POST).

/** `RefuseNullFieldsPipe` lets only these be null on PATCH. */
export const NULLABLE_CONTEST_FIELDS = [
  'timeLimit',
  'registrationStart',
  'registrationEnd',
  'lockedAfter',
  'ratingFloor',
  'ratingCeiling',
] as const;
/**
 * Fields the backend gates on a permission when a create changes them (C2). A create by an account without the permission leaves the
 * whole group out of the body, so the plain `judge.add_contest` holder never gets a 403 for a default (`rateAll` included).
 */
export const GATED_CONTEST_FIELDS: Record<string, readonly (keyof ContestForm)[]> = {
  'judge.contest_rating': ['isRated', 'rateAll', 'rateExclude', 'ratingFloor', 'ratingCeiling'],
  'judge.lock_contest': ['lockedAfter'],
  'judge.create_private_contest': [
    'isPrivate',
    'privateContestants',
    'isOrganizationPrivate',
    'organizations',
  ],
  'judge.contest_access_code': ['accessCode'],
  'judge.change_contest_visibility': ['isVisible'],
};
const DATE_FIELDS = [
  'startTime',
  'endTime',
  'registrationStart',
  'registrationEnd',
  'lockedAfter',
] as const;
const CHIP_FIELDS = [
  'authors',
  'curators',
  'testers',
  'viewContestScoreboard',
  'privateContestants',
  'bannedUsers',
  'rateExclude',
  'organizations',
  'balloonStaff',
] as const;
/** Handled by `specialFields`, never compared plainly. */
const SPECIAL = [
  'accessCode',
  'removeAccessCode',
  'rankingAccessCode',
  'removeRankingAccessCode',
  'formatConfig',
];

const sameJson = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const isNullable = (key: string) => (NULLABLE_CONTEST_FIELDS as readonly string[]).includes(key);
const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** A form value as the DTO wants it, or `undefined` when it must not be sent (a non-nullable field left empty). */
function sentValue(key: keyof ContestForm, value: unknown): unknown {
  if ((CHIP_FIELDS as readonly string[]).includes(key))
    return (value as UserChip[]).map((chip) => chip.id);
  if ((DATE_FIELDS as readonly string[]).includes(key))
    return value || (isNullable(key) ? null : undefined);
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  if (value === null) return isNullable(key) ? null : undefined;
  return value;
}

/** The access codes and the format: sent only when typed, removed, or changed. */
function specialFields(before: ContestForm, after: ContestForm): ContestPatch {
  const patch: Record<string, unknown> = {};
  if (after.removeAccessCode) patch.accessCode = '';
  else if (after.accessCode !== '') patch.accessCode = after.accessCode;
  if (after.removeRankingAccessCode) patch.rankingAccessCode = '';
  else if (after.rankingAccessCode !== '') patch.rankingAccessCode = after.rankingAccessCode;
  if (!sameJson(before.formatConfig, after.formatConfig) || before.formatName !== after.formatName)
    patch.formatConfig = after.formatConfig;
  return patch;
}

/** Only the changed members, with the PATCH meaning of null (a cleared nullable field) and never a null for a field that refuses it. */
export function changedContestFields(before: ContestForm, after: ContestForm): ContestPatch {
  const patch: Record<string, unknown> = { ...specialFields(before, after) };
  for (const key of Object.keys(after) as (keyof ContestForm)[]) {
    if (SPECIAL.includes(key) || key === 'key' || sameJson(before[key], after[key])) continue;
    const value = sentValue(key, after[key]);
    if (value !== undefined) patch[key] = value;
  }
  return patch;
}

/**
 * Mirrors the backend: `judge.change_contest_visibility` shows any contest; `judge.create_private_contest` only a private or
 * organization-private one (`inOrganization`: a contest created for an organization, which the server makes private).
 */
export function canSetVisible(
  form: Pick<ContestForm, 'isPrivate' | 'isOrganizationPrivate'>,
  can: (permission: string) => boolean,
  inOrganization = false,
): boolean {
  if (can('judge.change_contest_visibility')) return true;
  const isPrivately = form.isPrivate || form.isOrganizationPrivate || inOrganization;
  return isPrivately && can('judge.create_private_contest');
}

const isGatedOff = (
  key: keyof ContestForm,
  form: ContestForm,
  can: (permission: string) => boolean,
  inOrganization: boolean,
) => {
  if (key === 'isVisible') return !canSetVisible(form, can, inOrganization);
  return Object.entries(GATED_CONTEST_FIELDS).some(
    ([permission, fields]) => fields.includes(key) && !can(permission),
  );
};

/** The create body's optional members that are filled and that `can` lets through (a gated group needs its permission). */
function filledFields(
  form: ContestForm,
  can: (permission: string) => boolean,
  inOrganization: boolean,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(form) as (keyof ContestForm)[]) {
    if (SPECIAL.includes(key) || isGatedOff(key, form, can, inOrganization)) continue;
    const value = sentValue(key, form[key]);
    if (!isEmptyValue(value)) fields[key] = value;
  }
  return fields;
}

/** The POST body: required fields always, optional ones only when filled, and a permission-gated group only when `can` holds its permission. */
export function toContestBody(
  form: ContestForm,
  can: (permission: string) => boolean,
  inOrganization = false,
): ContestBody {
  const optional = {
    ...specialFields(emptyContestForm(), form),
    ...filledFields(form, can, inOrganization),
  };
  if (!can('judge.contest_access_code')) delete optional.accessCode;
  return { ...optional, ...requiredContestFields(form) };
}

/** Typed from the generated body: a required member the backend adds is a compile error here until it is listed. */
const requiredContestFields = (form: ContestForm): RequiredPart<ContestBody> => ({
  key: form.key,
  name: form.name.trim(),
  startTime: form.startTime,
  endTime: form.endTime,
});
