import type { Profile, ProfilePatch } from '@/api/types/profile';

/** backend `FIRST_NAME_MAX_LENGTH` and `ABOUT_MAX_LENGTH`; both count UTF-16 units, like class-validator's `MaxLength`. */
export const FIRST_NAME_MAX_LENGTH = 30;
export const ABOUT_MAX_LENGTH = 65_536;

/** What the profile form edits; theme, look, badge, editor colour and maths engine are not the form's. */
export interface ProfileDraft {
  firstName: string;
  about: string;
  timezone: string;
  languageId: string | null;
  organizationIds: string[];
}
export type LengthField = 'firstName' | 'about';
export interface LengthProblem {
  field: LengthField;
  used: number;
  max: number;
}

const LIMITS: ReadonlyArray<readonly [LengthField, number]> = [
  ['firstName', FIRST_NAME_MAX_LENGTH],
  ['about', ABOUT_MAX_LENGTH],
];
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export const draftOf = (profile: Profile): ProfileDraft => ({
  firstName: profile.firstName,
  about: profile.about,
  timezone: profile.timezone,
  languageId: profile.languageId,
  organizationIds: profile.organizations.map((organization) => organization.id),
});

export const copyDraft = (draft: ProfileDraft): ProfileDraft => ({
  ...draft,
  organizationIds: [...draft.organizationIds],
});

/** Only what changed, so a save never rewrites a field the viewer did not touch. */
export const changedFields = (draft: ProfileDraft, saved: ProfileDraft): ProfilePatch => ({
  ...(draft.firstName !== saved.firstName && { firstName: draft.firstName }),
  ...(draft.about !== saved.about && { about: draft.about }),
  ...(draft.timezone !== saved.timezone && { timezone: draft.timezone }),
  // The backend refuses `null` for the language: a draft without one sends nothing.
  ...(draft.languageId !== null &&
    draft.languageId !== saved.languageId && { languageId: draft.languageId }),
  ...(!same(draft.organizationIds, saved.organizationIds) && {
    organizations: draft.organizationIds,
  }),
});

/** Over-long texts, caught before sending: the form shows the count as the viewer types. */
export const lengthProblems = (draft: ProfileDraft): LengthProblem[] =>
  LIMITS.filter(([field, max]) => draft[field].length > max).map(([field, max]) => ({
    field,
    used: draft[field].length,
    max,
  }));

/** After a save: a field untouched since sending takes the stored value (the backend trims the name); newer typing stays. */
export function settleAfterSave(
  current: ProfileDraft,
  sent: ProfileDraft,
  stored: ProfileDraft,
): ProfileDraft {
  const pick = <Key extends keyof ProfileDraft>(key: Key): ProfileDraft[Key] =>
    same(current[key], sent[key]) ? stored[key] : current[key];
  return {
    firstName: pick('firstName'),
    about: pick('about'),
    timezone: pick('timezone'),
    languageId: pick('languageId'),
    organizationIds: pick('organizationIds'),
  };
}

/** The server's membership list, keeping every other edit. */
export const withOrganizationsOf = (draft: ProfileDraft, profile: Profile): ProfileDraft => ({
  ...draft,
  organizationIds: profile.organizations.map((organization) => organization.id),
});
