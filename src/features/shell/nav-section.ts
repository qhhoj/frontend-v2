import { computed, onScopeDispose, shallowReactive, watchEffect } from 'vue';

/** Each mounted page's claim; a Map keeps the order, so the newest page's claim wins while the old one unmounts. */
const claims = shallowReactive(new Map<symbol, string | null>());

/** The nav path a page asked to light instead of the one its own path falls under; null when none asked. */
export const navSectionOverride = computed(
  () => [...claims.values()].filter((path) => path !== null).at(-1) ?? null,
);

/**
 * Lights another nav section while the calling page lives: a problem the viewer solves inside a contest is part of
 * "Kỳ thi", not "Bài tập". `section` returns a nav path (`/contests`) or null for the page's own section.
 */
export function useNavSection(section: () => string | null) {
  const id = Symbol('nav-section');
  watchEffect(() => claims.set(id, section()));
  onScopeDispose(() => claims.delete(id));
}
