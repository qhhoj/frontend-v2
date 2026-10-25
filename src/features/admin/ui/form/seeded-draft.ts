import { watch } from 'vue';
import { useRoute } from 'vue-router';

export interface SeededDraftOptions<Stored> {
  /** The stored item's id as the route names it: the contest key, the problem code. */
  idOf: (stored: Stored) => string;
  /** The route param that names the item (`key`, `code`). */
  routeParam: string;
  /** Whether the draft holds edits not saved yet. */
  isDirty: () => boolean;
  /** Fills the draft and its baseline from a stored copy. */
  refill: (stored: Stored) => void;
}

/**
 * Which item an editor's draft was filled from, and when it is filled again. Another item always refills it (the leave guard
 * has asked first); a newer copy of the same item refills it only while it is clean, so an edit is never lost.
 * A save goes to `target()`: the seeded item, or `null` while the screen or the route names another one, and the save is
 * then refused, so one item's edits are never written into another.
 */
export function useSeededDraft<Stored>(source: () => Stored, options: SeededDraftOptions<Stored>) {
  const route = useRoute();
  let seededId = options.idOf(source());

  function reseed(stored: Stored) {
    seededId = options.idOf(stored);
    options.refill(stored);
  }
  watch(source, (next) => {
    if (options.idOf(next) === seededId && options.isDirty()) return;
    reseed(next);
  });

  function target(): string | null {
    const named = route.params[options.routeParam];
    const isShown = options.idOf(source()) === seededId && String(named) === seededId;
    return isShown ? seededId : null;
  }

  return { target, reseed };
}
