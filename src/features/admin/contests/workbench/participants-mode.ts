import type { ContestForm } from '../contest-form';

/**
 * Who may take part. The API keeps three independent restrictions and applies all that are set:
 * - `organization` (`isOrganizationPrivate` + `organizations`) and `list` (`isPrivate` + `privateContestants`) decide
 *   who sees a shown contest and who may join it; with both set an account must pass both;
 * - `code` (the access code) decides only who may join: it hides nothing.
 * With neither `organization` nor `list`, a shown contest is seen by everyone, guests included.
 *
 * The page offers one choice (a restriction, or `open` for none), but it never drops a restriction on its own: a pick
 * only switches restrictions on and off in the form (the lists stay), the section says what the save will remove, and
 * `accessSaveOf` decides whether the save is blocked, needs a confirm, or may go.
 */
export const RESTRICTIONS = ['organization', 'code', 'list'] as const;
export type Restriction = (typeof RESTRICTIONS)[number];
export const PARTICIPANT_MODES = [...RESTRICTIONS, 'open'] as const;
export type ParticipantMode = (typeof PARTICIPANT_MODES)[number];

export type AccessFields = Pick<
  ContestForm,
  | 'isPrivate'
  | 'privateContestants'
  | 'isOrganizationPrivate'
  | 'organizations'
  | 'accessCode'
  | 'removeAccessCode'
>;

/** True when the contest will have an access code after the save: a stored one that is kept, or one typed now. */
export const keepsAccessCode = (form: AccessFields, hasStoredCode: boolean) =>
  form.accessCode !== '' || (hasStoredCode && !form.removeAccessCode);

/** Every restriction the form has on, in the order they are offered. An old contest may have more than one. */
export function activeRestrictions(form: AccessFields, hasStoredCode: boolean): Restriction[] {
  const isOn: Record<Restriction, boolean> = {
    organization: form.isOrganizationPrivate,
    code: keepsAccessCode(form, hasStoredCode),
    list: form.isPrivate,
  };
  return RESTRICTIONS.filter((restriction) => isOn[restriction]);
}

/**
 * The teacher picked `mode`: its restriction is switched on and the other two off. Only the switches change: the
 * organizations and the list stay in the form, and a code typed but not saved is dropped when the mode is not `code`.
 */
export function chooseParticipantMode(
  form: AccessFields,
  mode: ParticipantMode,
  hasStoredCode: boolean,
): void {
  form.isOrganizationPrivate = mode === 'organization';
  form.isPrivate = mode === 'list';
  if (mode !== 'code') form.accessCode = '';
  form.removeAccessCode = mode !== 'code' && hasStoredCode;
}

/** Puts the form's restrictions back to the stored contest's, lists included. */
export function restoreAccess(form: AccessFields, stored: AccessFields): void {
  form.isOrganizationPrivate = stored.isOrganizationPrivate;
  form.organizations = [...stored.organizations];
  form.isPrivate = stored.isPrivate;
  form.privateContestants = [...stored.privateContestants];
  form.accessCode = '';
  form.removeAccessCode = false;
}

/** The restrictions the section shows a field for: every one the form has on, and the picked one while it is not set yet. */
export function shownRestrictions(
  form: AccessFields,
  choice: ParticipantMode | null,
  hasStoredCode: boolean,
): Restriction[] {
  const active = activeRestrictions(form, hasStoredCode);
  return RESTRICTIONS.filter(
    (restriction) => active.includes(restriction) || choice === restriction,
  );
}

/** The one mode shown as chosen: the pick, else what the form has; null when it has two or three restrictions at once. */
export function shownModeOf(
  form: AccessFields,
  choice: ParticipantMode | null,
  hasStoredCode: boolean,
): ParticipantMode | null {
  if (choice !== null) return choice;
  const active = activeRestrictions(form, hasStoredCode);
  if (active.length > 1) return null;
  return active[0] ?? 'open';
}

/** The shown restrictions that restrict nothing sensible yet: no organization, an empty list, no code. */
export function participantGapsOf(
  form: AccessFields,
  choice: ParticipantMode | null,
  hasStoredCode: boolean,
): Restriction[] {
  const isMissing: Record<Restriction, boolean> = {
    organization: form.organizations.length === 0,
    code: !keepsAccessCode(form, hasStoredCode),
    list: form.privateContestants.length === 0,
  };
  return shownRestrictions(form, choice, hasStoredCode).filter(
    (restriction) => isMissing[restriction],
  );
}

export interface AccessChanges {
  /** Restrictions the stored contest has and the save would take away: more accounts see or join it. */
  removed: Restriction[];
  /** Restrictions the save would add. */
  added: Restriction[];
}

/** What the save would do to the restrictions, read from the stored contest (`stored`) and the form, not from the pick. */
export function accessChangesOf(
  stored: AccessFields,
  form: AccessFields,
  hasStoredCode: boolean,
): AccessChanges {
  const before = activeRestrictions(stored, hasStoredCode);
  const after = activeRestrictions(form, hasStoredCode);
  return {
    removed: before.filter((restriction) => !after.includes(restriction)),
    added: after.filter((restriction) => !before.includes(restriction)),
  };
}

const idsOf = (chips: readonly { id: string }[]) => chips.map((chip) => chip.id).join(',');

/** True when the form differs from the stored contest in any field that says who may take part. */
export function isAccessEdited(stored: AccessFields, form: AccessFields): boolean {
  return (
    stored.isOrganizationPrivate !== form.isOrganizationPrivate ||
    stored.isPrivate !== form.isPrivate ||
    idsOf(stored.organizations) !== idsOf(form.organizations) ||
    idsOf(stored.privateContestants) !== idsOf(form.privateContestants) ||
    form.accessCode !== '' ||
    form.removeAccessCode
  );
}

/**
 * What the page does with a save:
 * - `blocked`: the teacher changed who may take part and a restriction is incomplete (`gaps`): nothing is sent;
 * - `confirm`: the save removes a restriction: the teacher confirms first. `remaining`: what still restricts after it;
 * - `send`: the save only narrows, or does not change, who may take part.
 */
export type AccessSave =
  | { kind: 'blocked'; gaps: Restriction[] }
  | { kind: 'confirm'; removed: Restriction[]; remaining: Restriction[] }
  | { kind: 'send' };

/** Old data that is incomplete as stored (a private contest with an empty list) never blocks a save that leaves it alone. */
export function accessSaveOf(
  stored: AccessFields,
  form: AccessFields,
  choice: ParticipantMode | null,
  hasStoredCode: boolean,
): AccessSave {
  const gaps = participantGapsOf(form, choice, hasStoredCode);
  const isTouched = choice !== null || isAccessEdited(stored, form);
  if (isTouched && gaps.length > 0) return { kind: 'blocked', gaps };
  const { removed } = accessChangesOf(stored, form, hasStoredCode);
  if (removed.length === 0) return { kind: 'send' };
  return { kind: 'confirm', removed, remaining: activeRestrictions(form, hasStoredCode) };
}

/** Who sees a shown contest and may join it, by the restrictions that hide it (`code` hides nothing). */
export type Audience = 'everyone' | 'organization' | 'list' | 'both';
export function audienceOf(restrictions: readonly Restriction[]): Audience {
  const byOrganization = restrictions.includes('organization');
  const byList = restrictions.includes('list');
  if (byOrganization && byList) return 'both';
  if (byOrganization) return 'organization';
  return byList ? 'list' : 'everyone';
}
