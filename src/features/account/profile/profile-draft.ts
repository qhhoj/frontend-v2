import type { Profile, ProfilePatch } from '@/api/types/profile';

/** backend `FIRST_NAME_MAX_LENGTH` and `ABOUT_MAX_LENGTH`; both are checked with `storedLength`, like the backend's `@MaxLength`. */
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

/** The text as the backend stores it: NFC, so an accented letter is one unit whichever way the keyboard typed it. */
export const toNfc = (text: string): string => text.normalize('NFC');
// The rule of validator's `isLength`, which class-validator's `@MaxLength` calls (backend-v2 node_modules/validator/lib/
// isLength.js; the DTO is apps/api/src/modules/users/profile/dto/profile.dto.ts): a surrogate pair counts 1, and so does a
// character followed by a variation selector (U+FE0E or U+FE0F), so an emoji counts 1.
const PRESENTATION_SEQUENCE = /[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g;
const SURROGATE_PAIR = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

/** The length the backend's `@MaxLength` measures, of the NFC text the browser sends. */
export function storedLength(text: string): number {
  const nfc = toNfc(text);
  return (
    nfc.length -
    (nfc.match(PRESENTATION_SEQUENCE)?.length ?? 0) -
    (nfc.match(SURROGATE_PAIR)?.length ?? 0)
  );
}

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
  ...(toNfc(draft.firstName) !== toNfc(saved.firstName) && { firstName: toNfc(draft.firstName) }),
  ...(toNfc(draft.about) !== toNfc(saved.about) && { about: toNfc(draft.about) }),
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
  LIMITS.filter(([field, max]) => storedLength(draft[field]) > max).map(([field, max]) => ({
    field,
    used: storedLength(draft[field]),
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

/**
 * The draft ids rebased onto the server's list after a 409. The viewer's order holds for the organizations both still
 * list; an organization another device added is appended in server order. An organization the server dropped leaves.
 * An organization the viewer removed comes back while the server still lists it: the failed save refused the removal
 * (an admin cannot leave), so the server's answer stands. A removal the server agrees with stays gone, because the
 * server no longer lists the organization.
 */
export function rebaseOrganizationIds(
  draftIds: readonly string[],
  serverIds: readonly string[],
): string[] {
  const listed = new Set(serverIds);
  const inDraft = new Set(draftIds);
  return [
    ...draftIds.filter((id) => listed.has(id)),
    ...serverIds.filter((id) => !inDraft.has(id)),
  ];
}

export const withRebasedOrganizations = (draft: ProfileDraft, profile: Profile): ProfileDraft => ({
  ...draft,
  organizationIds: rebaseOrganizationIds(
    draft.organizationIds,
    profile.organizations.map((organization) => organization.id),
  ),
});

/** The server's membership list, keeping every other edit. */
export const withOrganizationsOf = (draft: ProfileDraft, profile: Profile): ProfileDraft => ({
  ...draft,
  organizationIds: profile.organizations.map((organization) => organization.id),
});
