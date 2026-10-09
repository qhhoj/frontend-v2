import type { FlatpageBody, FlatpageRevision } from '@/api/types/flatpages-admin';
import { translate } from '@/i18n';

export const MAX_CHANGE_LINES = 40;
type Changes = FlatpageRevision['changes'];
export interface ChangeLine {
  field: string;
  removed: string[];
  added: string[];
  hidden: number;
}

const FIELD_LABEL_KEYS: Record<string, string> = {
  url: 'admin.pages.history.fields.url',
  title: 'admin.pages.history.fields.title',
  content: 'admin.pages.history.fields.content',
  registrationRequired: 'admin.pages.history.fields.registrationRequired',
};
export const fieldLabelKey = (field: string) => FIELD_LABEL_KEYS[field] ?? field;

/** Lines that exist only on one side, each line matched against the other side once (a repeated line counts). */
function unmatched(lines: string[], other: string[]): string[] {
  const pool = new Map<string, number>();
  for (const line of other) pool.set(line, (pool.get(line) ?? 0) + 1);
  return lines.filter((line) => {
    const left = pool.get(line) ?? 0;
    if (left > 0) pool.set(line, left - 1);
    return left === 0 && line.trim() !== '';
  });
}

export function lineChanges(before: string, after: string) {
  const [from, to] = [before.split('\n'), after.split('\n')];
  return { removed: unmatched(from, to), added: unmatched(to, from) };
}

function textOf(value: unknown): string {
  if (typeof value === 'boolean')
    return translate(value ? 'admin.pages.history.yes' : 'admin.pages.history.no');
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function capped(lines: string[]) {
  return {
    shown: lines.slice(0, MAX_CHANGE_LINES),
    hidden: Math.max(0, lines.length - MAX_CHANGE_LINES),
  };
}

export function changeLinesOf(changes: Changes): ChangeLine[] {
  return Object.entries(changes).map(([field, { before, after }]) => {
    const { removed, added } =
      field === 'content'
        ? lineChanges(textOf(before), textOf(after))
        : {
            removed: before == null ? [] : [textOf(before)],
            added: after == null ? [] : [textOf(after)],
          };
    const [shownRemoved, shownAdded] = [capped(removed), capped(added)];
    return {
      field,
      removed: shownRemoved.shown,
      added: shownAdded.shown,
      hidden: shownRemoved.hidden + shownAdded.hidden,
    };
  });
}

/** Only an edit has a `before` worth loading: a creation has none, a deletion has no page to load it into. */
export const canLoadOldValues = (revision: Pick<FlatpageRevision, 'action'>) =>
  revision.action === 'edit';

/** The form with each changed field set back to its `before`; a value of the wrong type or an unknown field is ignored. */
export function prefillOf(current: FlatpageBody, changes: Changes): FlatpageBody {
  const next = { ...current };
  for (const [field, { before }] of Object.entries(changes)) {
    if (field === 'registrationRequired' && typeof before === 'boolean')
      next.registrationRequired = before;
    if ((field === 'url' || field === 'title' || field === 'content') && typeof before === 'string')
      next[field] = before;
  }
  return next;
}
