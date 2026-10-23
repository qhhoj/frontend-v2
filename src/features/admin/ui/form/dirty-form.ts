import { computed, ref, toRaw } from 'vue';
import type { Ref } from 'vue';

/** Deep equality for form values: plain objects, arrays, dates and primitives. A missing key equals `undefined`. */
export function isSameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date || right instanceof Date)
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => isSameValue(item, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => isSameValue(left[key], right[key]));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Line breaks as a `<textarea>` hands them back (`\n`). Legacy text stored with `\r\n` seeded as is would differ from the
 * box's value after any keystroke, so a form counts a change nobody can see: seed multi-line API text through this.
 */
export const normalizeNewlines = (text: string): string => text.replace(/\r\n?/g, '\n');

/**
 * What to send for text seeded through `normalizeNewlines`: the stored original while the edit differs from it only in line
 * breaks, so saving another field never rewrites the text (nor trips a backend check on a changed text).
 */
export const sentText = (edited: string, stored: string): string =>
  normalizeNewlines(stored) === edited ? stored : edited;

/** How many top-level fields differ: the "3 thay đổi chưa lưu" count. */
export function countChanges(current: object, baseline: object): number {
  const now = current as Record<string, unknown>;
  const then = baseline as Record<string, unknown>;
  const keys = new Set([...Object.keys(now), ...Object.keys(then)]);
  return [...keys].filter((key) => !isSameValue(now[key], then[key])).length;
}

/** A deep copy of a form value that is safe on Vue proxies (structuredClone refuses them). */
export function cloneValue<T>(value: T): T {
  const raw = toRaw(value) as unknown;
  if (raw instanceof Date) return new Date(raw.getTime()) as T;
  if (Array.isArray(raw)) return raw.map((item) => cloneValue(item)) as T;
  if (!isRecord(raw)) return raw as T;
  return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, cloneValue(item)])) as T;
}

/**
 * A form's draft against its last saved state. `dirtyCount` counts changed top-level fields; `discard()` puts the draft back;
 * `commit(saved?)` makes the saved value (or the draft) the new baseline after a successful save.
 */
export function useDirtyForm<T extends object>(initial: T) {
  const baseline = ref(cloneValue(initial)) as Ref<T>;
  const draft = ref(cloneValue(initial)) as Ref<T>;
  const dirtyCount = computed(() => countChanges(draft.value, baseline.value));
  const isDirty = computed(() => dirtyCount.value > 0);

  function discard() {
    draft.value = cloneValue(baseline.value);
  }
  function commit(saved: T = draft.value) {
    baseline.value = cloneValue(saved);
    draft.value = cloneValue(saved);
  }

  return { draft, baseline, dirtyCount, isDirty, discard, commit };
}
