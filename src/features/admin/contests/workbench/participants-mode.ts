import type { ContestForm } from '../contest-form';

/**
 * Who may take part, as one choice. The API keeps three independent groups of fields (members of organizations, an
 * access code, a chosen list); the server does not make them exclusive, so the page does: picking a mode sets its group
 * and clears the other two. `open` is none of the three: every account that sees the contest may join.
 */
export const PARTICIPANT_MODES = ['organization', 'code', 'list', 'open'] as const;
export type ParticipantMode = (typeof PARTICIPANT_MODES)[number];

type AccessFields = Pick<
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

/** Every group the form has set, in the order the modes are offered. An old contest may have more than one. */
export function activeModes(form: AccessFields, hasStoredCode: boolean): ParticipantMode[] {
  const modes: ParticipantMode[] = [];
  if (form.isOrganizationPrivate) modes.push('organization');
  if (keepsAccessCode(form, hasStoredCode)) modes.push('code');
  if (form.isPrivate) modes.push('list');
  return modes;
}

/** The one mode the page shows as chosen: the narrowest group that is set (a list, then organizations, then a code). */
export function participantModeOf(form: AccessFields, hasStoredCode: boolean): ParticipantMode {
  const modes = activeModes(form, hasStoredCode);
  if (modes.includes('list')) return 'list';
  if (modes.includes('organization')) return 'organization';
  return modes.includes('code') ? 'code' : 'open';
}

/**
 * Sets `mode`'s group on the form and clears the other two. Called only when the teacher picks a mode, never on load:
 * an old contest with two groups keeps both until its teacher chooses.
 */
export function chooseParticipantMode(
  form: AccessFields,
  mode: ParticipantMode,
  hasStoredCode: boolean,
): void {
  form.isOrganizationPrivate = mode === 'organization';
  if (mode !== 'organization') form.organizations = [];
  form.isPrivate = mode === 'list';
  if (mode !== 'list') form.privateContestants = [];
  if (mode !== 'code') form.accessCode = '';
  form.removeAccessCode = mode !== 'code' && hasStoredCode;
}

/** What the chosen mode still lacks before it means anything; null when it is complete. */
export function participantGapOf(
  form: AccessFields,
  hasStoredCode: boolean,
): 'organization' | 'code' | 'list' | null {
  const mode = participantModeOf(form, hasStoredCode);
  if (mode === 'organization' && form.organizations.length === 0) return 'organization';
  if (mode === 'list' && form.privateContestants.length === 0) return 'list';
  return null;
}
