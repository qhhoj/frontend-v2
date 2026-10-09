import type { LocationQuery, LocationQueryValue, RouteLocationRaw } from 'vue-router';

/** The list page lets a viewer tick this many rows: the first is the left side, the second the right. */
export const MAX_DIFF_PICKS = 2;
/** Backend ids (UUIDv7) and short fixture ids: letters, digits, `-` and `_`. */
const SUBMISSION_ID = /^[A-Za-z0-9_-]{1,64}$/;
const SUBMISSION_LINK = /\/submissions\/([^/?#\s]+)/;
/** A static route under `/submissions/`, never a submission id. */
const RESERVED_SEGMENTS = new Set(['diff']);

export interface DiffPair {
  left: string;
  right: string;
}

/** An id typed or pasted by the viewer: the bare id, `#<id>`, or any link containing `/submissions/<id>`. */
export function parseSubmissionRef(text: string): string | null {
  const trimmed = text.trim().replace(/^#/, '');
  const candidate = SUBMISSION_LINK.exec(trimmed)?.[1] ?? trimmed;
  return SUBMISSION_ID.test(candidate) && !RESERVED_SEGMENTS.has(candidate) ? candidate : null;
}

const singleRef = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  typeof value === 'string' ? parseSubmissionRef(value) : null;

/** Both sides of `/submissions/diff?left=&right=`, or null when either is missing, invalid or they are the same. */
export function diffPairOf(query: LocationQuery): DiffPair | null {
  const left = singleRef(query.left);
  const right = singleRef(query.right);
  return left !== null && right !== null && left !== right ? { left, right } : null;
}

/** Ticks or unticks `id`; a third tick is ignored. Returns a new list. */
export function toggleDiffPick(picked: readonly string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((pickedId) => pickedId !== id);
  return picked.length < MAX_DIFF_PICKS ? [...picked, id] : [...picked];
}

export const diffRoute = ({ left, right }: DiffPair): RouteLocationRaw => ({
  name: 'submission-diff',
  query: { left, right },
});
