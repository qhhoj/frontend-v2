/** Every refusal the backend names for register, join and leave (participation-refusals.ts). Each one has its own `errors.<code>` text. */
export const PARTICIPATION_REFUSALS = [
  'editor_cannot_register',
  'banned_from_contest',
  'registration_not_required',
  'registration_closed',
  'contest_ended',
  'already_registered',
  'contest_not_started',
  'virtual_disallowed',
  'not_registered',
  'access_code_required',
  'wrong_access_code',
  'rules_not_accepted',
  'rules_changed',
  'not_in_contest',
] as const;

export type ParticipationRefusal = (typeof PARTICIPATION_REFUSALS)[number];
