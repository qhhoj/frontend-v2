import { diffLines } from 'diff';
import type { CommentRevision } from '@/api/types/comments';

/** One version of a comment's text; `edit` 0 is the original. */
export interface CommentVersion {
  edit: number;
  text: string;
  /** When this version was saved; null for the original (its time is the comment's own). */
  at: string | null;
  editor: CommentRevision['editor'];
  /** The text it replaced; null for the original. */
  previous: string | null;
}

/** Every version newest first, from the revisions (the API lists them newest first; each holds the text before and after its edit). */
export function versionsOf(revisions: readonly CommentRevision[]): CommentVersion[] {
  if (!revisions.length) return [];
  const edits = revisions.map((revision, index) => ({
    edit: revisions.length - index,
    text: revision.after,
    at: revision.at,
    editor: revision.editor,
    previous: revision.before,
  }));
  const original = revisions[revisions.length - 1]!;
  return [...edits, { edit: 0, text: original.before, at: null, editor: null, previous: null }];
}

/** One line of a unified diff: kept, removed or added. */
export interface DiffLine {
  kind: 'same' | 'removed' | 'added';
  text: string;
}

/** Every line ends in a newline, so a last line is not "changed" only because a newline followed it later. */
const asLines = (text: string) => (text.endsWith('\n') ? text : `${text}\n`);

/** Line-by-line changes from `before` to `after`, in reading order. */
export function unifiedDiff(before: string, after: string): DiffLine[] {
  return diffLines(asLines(before), asLines(after)).flatMap((change) => {
    const kind = change.added ? 'added' : change.removed ? 'removed' : 'same';
    return change.value
      .replace(/\n$/, '')
      .split('\n')
      .map((text) => ({ kind, text }));
  });
}
