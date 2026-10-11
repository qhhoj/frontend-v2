import { advancedChangeCount, pickFields } from '../../ui/form/editor-view';
import { emptyContestForm } from '../contest-form';
import type { ContestForm } from '../contest-form';
import { FORMAT_DEFAULTS } from '../format-config';

/** The Basic view of the contest form ("Cơ bản"); every other field is in the Advanced view. */
export const CONTEST_BASIC_FIELDS = [
  'key',
  'name',
  'startTime',
  'endTime',
  'formatName',
  'isVisible',
  'scoreboardVisibility',
] as const satisfies readonly (keyof ContestForm)[];

/** Set by the server, not by the editor: the creator as author, an organization contest's members-only access. */
const UNCOUNTED: readonly (keyof ContestForm)[] = [
  'authors',
  'organizations',
  'isOrganizationPrivate',
];

const COUNTED = (Object.keys(emptyContestForm()) as (keyof ContestForm)[]).filter(
  (field) =>
    !(CONTEST_BASIC_FIELDS as readonly string[]).includes(field) && !UNCOUNTED.includes(field),
);

/** The Advanced tab's badge: Advanced values off their default (the chosen format's own config) or not saved yet. */
export function contestAdvancedCount(form: ContestForm, saved: ContestForm): number {
  const defaults = { ...emptyContestForm(), formatConfig: { ...FORMAT_DEFAULTS[form.formatName] } };
  return advancedChangeCount(
    pickFields(form, COUNTED),
    pickFields(saved, COUNTED),
    pickFields(defaults, COUNTED),
  );
}
