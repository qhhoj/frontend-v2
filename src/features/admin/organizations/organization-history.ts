import type { OrganizationRevision } from '@/api/types/organizations';
import { translate } from '@/i18n';
import { lineChanges, MAX_CHANGE_LINES } from '../pages/flatpage-history';

export interface OrganizationChange {
  field: string;
  removed: string[];
  added: string[];
  /** Lines beyond the cap, so a rewritten about text stays readable. */
  hidden: number;
}

/** Fields the history has a label for; anything else shows its wire name. */
const LABELLED_FIELDS = [
  'name',
  'slug',
  'shortName',
  'about',
  'isOpen',
  'isUnlisted',
  'slots',
  'logoOverrideImage',
  'admins',
  'member',
];
export const changeLabelOf = (field: string) =>
  LABELLED_FIELDS.includes(field)
    ? translate(`admin.organizations.history.fields.${field}`)
    : field;

function textOf(value: unknown): string {
  if (typeof value === 'boolean')
    return translate(value ? 'admin.organizations.history.yes' : 'admin.organizations.history.no');
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** Admin lists show who joined and who left; the about text shows changed lines; other fields their old and new value. */
function changeOf(
  field: string,
  before: unknown,
  after: unknown,
): Omit<OrganizationChange, 'hidden'> {
  if (field === 'admins' && Array.isArray(before) && Array.isArray(after))
    return {
      field,
      removed: before.filter((name) => !after.includes(name)).map(String),
      added: after.filter((name) => !before.includes(name)).map(String),
    };
  if (field === 'about')
    return { field, ...lineChanges(textOf(before ?? ''), textOf(after ?? '')) };
  return {
    field,
    removed: before == null ? [] : [textOf(before)],
    added: after == null ? [] : [textOf(after)],
  };
}

/** Each side keeps at most `MAX_CHANGE_LINES` lines, like the static page history. */
function capped(change: Omit<OrganizationChange, 'hidden'>): OrganizationChange {
  const overflow = (lines: string[]) => Math.max(0, lines.length - MAX_CHANGE_LINES);
  return {
    field: change.field,
    removed: change.removed.slice(0, MAX_CHANGE_LINES),
    added: change.added.slice(0, MAX_CHANGE_LINES),
    hidden: overflow(change.removed) + overflow(change.added),
  };
}

export const changesOf = (revision: OrganizationRevision): OrganizationChange[] =>
  Object.entries(revision.changes).map(([field, { before, after }]) =>
    capped(changeOf(field, before, after)),
  );
