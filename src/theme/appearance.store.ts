import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { appearanceVariables, parseAppearance } from './appearance';
import type { Appearance } from './appearance';

/** This browser's own choice. */
const CHOICE_KEY = 'qhhoj.appearance';
/** The look last painted, whatever chose it. Read by the pre-paint script in index.html to avoid a flash. */
const PAINTED_KEY = 'qhhoj.paintedAppearance';

const readLook = (key: string): Appearance | null => {
  try {
    return parseAppearance(JSON.parse(readStorage(key) ?? 'null'));
  } catch {
    return null;
  }
};
const rememberLook = (key: string, look: Appearance | null) =>
  writeStorage(key, JSON.stringify(look));

/** `null` removes everything: the page is the site's own look. */
function paint(look: Appearance | null) {
  const root = document.documentElement;
  if (!look) {
    delete root.dataset.accent;
    root.style.removeProperty('--qh-glass-level');
    root.style.removeProperty('--qh-blob-strength');
    return;
  }
  const variables = appearanceVariables(look);
  root.dataset.accent = variables.accent;
  root.style.setProperty('--qh-glass-level', variables.glass);
  root.style.setProperty('--qh-blob-strength', variables.blobStrength);
}

/** Where the look comes from. One object, so each action changes it in a single assignment. */
interface LookSources {
  /** This browser's own choice. */
  browser: Appearance | null;
  /** The signed-in account's look; `null` is "the account has none"; `undefined` is "not signed in (or not known yet)". */
  account: Appearance | null | undefined;
  /** True until the account, the browser or a choice speaks: the look the pre-paint script painted stays. */
  holdingPainted: boolean;
}

export const useAppearanceStore = defineStore('appearance', () => {
  // Unlike the theme store, no `resolvedBy` marker is needed: a look has no OS-dependent resolution, and a look painted
  // from this browser always equals `qhhoj.appearance`, so holding any painted look never shows a stale one.
  const paintedLook = readLook(PAINTED_KEY);
  const sources = ref<LookSources>({
    browser: readLook(CHOICE_KEY),
    account: undefined,
    holdingPainted: true,
  });

  /** The account outranks this browser; `null` from the account means the site look. */
  const look = computed(() => {
    const { account, holdingPainted, browser } = sources.value;
    if (account !== undefined) return account;
    return holdingPainted ? paintedLook : browser;
  });
  // Synchronous: the page must show a choice before the call returns, not on a later tick. Each action assigns
  // `sources` once, so this runs once with the final look.
  watch(
    look,
    (active) => {
      paint(active);
      if (!sources.value.holdingPainted) rememberLook(PAINTED_KEY, active);
    },
    { immediate: true, flush: 'sync' },
  );

  /** A user action: applies the look and remembers it as this browser's. */
  function choose(next: Appearance | null) {
    sources.value = { browser: next, account: undefined, holdingPainted: false };
    rememberLook(CHOICE_KEY, next);
  }

  /** The signed-in account's look, or `undefined` once signed out (back to this browser's own look). */
  function adopt(next: Appearance | null | undefined) {
    sources.value = { ...sources.value, account: next, holdingPainted: false };
  }

  return { look, choose, adopt };
});
