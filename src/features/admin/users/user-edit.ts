import type { OrganizationChip } from '@/api/types/admin-common';
import type { UserEdit, UserEditBody } from '@/api/types/users-admin';

/** The backend's `StaffDisplayRank`: `banned` is set by the ban route only. */
export const STAFF_DISPLAY_RANKS = ['user', 'setter', 'daor', 'staff', 'admin', 'teacher'] as const;
export type StaffDisplayRank = (typeof STAFF_DISPLAY_RANKS)[number];

/** The profile form's values; organizations are chips so the shared slug lookup can add them. */
export interface UserEditForm {
  displayName: string;
  fullName: string;
  email: string;
  about: string;
  displayRank: string;
  isUnlisted: boolean;
  mute: boolean;
  allowTagging: boolean;
  notes: string;
  leaveCurrentContest: boolean;
  organizations: OrganizationChip[];
}

export const userEditFormOf = (user: UserEdit): UserEditForm => ({
  displayName: user.displayName,
  fullName: user.fullName,
  email: user.email,
  about: user.about,
  displayRank: user.displayRank,
  isUnlisted: user.isUnlisted,
  mute: user.mute,
  allowTagging: user.allowTagging,
  notes: user.notes,
  leaveCurrentContest: false,
  organizations: user.organizations.map(({ id, slug }) => ({ id, slug })),
});

const TRIMMED = ['displayName', 'fullName', 'email'] as const;
const AS_IS = ['about', 'isUnlisted', 'mute', 'allowTagging', 'notes'] as const;

/** Only the fields that differ from the stored user, so an unchanged e-mail never needs `auth.change_user`. */
export function changedUserFields(user: UserEdit, form: UserEditForm): UserEditBody {
  const body: Record<string, unknown> = {};
  for (const key of TRIMMED) if (form[key].trim() !== user[key]) body[key] = form[key].trim();
  for (const key of AS_IS) if (form[key] !== user[key]) body[key] = form[key];
  if (form.displayRank !== user.displayRank) body.displayRank = form.displayRank;
  if (form.leaveCurrentContest) body.leaveCurrentContest = true;
  const ids = form.organizations.map((chip) => chip.id);
  if (ids.join() !== user.organizations.map((org) => org.id).join()) body.organizations = ids;
  return body;
}
