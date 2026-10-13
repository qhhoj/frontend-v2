import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Profile } from '@/api/types/profile';
import { readStorage, writeStorage } from '@/lib/storage';

/** Switch and count of the roaming Bits, as the profile stores them. */
export type BitRoamChoice = Profile['bitRoam'];

export const BIT_ROAM_MAX = 5;
export const DEFAULT_BIT_ROAM: BitRoamChoice = { on: false, count: 1 };
/** This browser's own choice (visitors, and what a signed-in viewer sees until the account answers). */
const CHOICE_KEY = 'qhhoj.bitRoam';
/** Set for the rest of the browser session once the Bits are shooed. */
const RESTING_KEY = 'qhhoj.bitRoamResting';

/** A stored value made safe: anything that is not a choice is the default, a count out of range is pulled into 1-5. */
export function parseBitRoam(value: unknown): BitRoamChoice {
  if (!value || typeof value !== 'object') return DEFAULT_BIT_ROAM;
  const { on, count } = value as Record<string, unknown>;
  if (typeof on !== 'boolean' || typeof count !== 'number' || !Number.isFinite(count))
    return DEFAULT_BIT_ROAM;
  return { on, count: Math.min(BIT_ROAM_MAX, Math.max(1, Math.round(count))) };
}

const readChoice = (): BitRoamChoice => {
  try {
    return parseBitRoam(JSON.parse(readStorage(CHOICE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_BIT_ROAM;
  }
};

/**
 * The roaming Bits preference. The signed-in account's choice outranks this browser's (same rule as the look, see
 * `appearance.store.ts`); a user action paints at once and becomes this browser's choice. `resting` is the shoo gesture: the
 * Bits are away until the browser session ends or "Gọi lại".
 */
export const useBitRoamStore = defineStore('bitRoam', () => {
  const browser = ref<BitRoamChoice>(readChoice());
  /** `undefined`: not signed in, or the account has not answered yet. */
  const account = ref<BitRoamChoice | undefined>(undefined);
  const resting = ref(readStorage(RESTING_KEY, 'session') === '1');

  const choice = computed(() => account.value ?? browser.value);

  /** A user action: shown at once and remembered in this browser. */
  function choose(patch: Partial<BitRoamChoice>) {
    const next = { ...choice.value, ...patch };
    browser.value = next;
    account.value = undefined;
    writeStorage(CHOICE_KEY, JSON.stringify(next));
  }

  /** The signed-in account's choice, or `undefined` once signed out. */
  function adopt(next: BitRoamChoice | undefined) {
    account.value = next;
  }

  function shoo() {
    resting.value = true;
    writeStorage(RESTING_KEY, '1', 'session');
  }
  function callBack() {
    resting.value = false;
    writeStorage(RESTING_KEY, '', 'session');
  }

  return { choice, resting, choose, adopt, shoo, callBack };
});
