import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import {
  DEFAULT_LOW_POWER,
  isLowPowerPreference,
  isWeakDevice,
  LOW_POWER_STORAGE_KEY,
  readDeviceHints,
  resolveLowPower,
} from './low-power';
import type { LowPowerPreference } from './low-power';

/** Writes the contract other code reads: `data-low-power` on `<html>` exactly while low-power is on. */
export function paintLowPower(isOn: boolean) {
  if (typeof document === 'undefined') return;
  if (isOn) document.documentElement.dataset.lowPower = '';
  else delete document.documentElement.dataset.lowPower;
}

/** The device's low-power choice: stored in this browser only (it describes the machine, not the account). */
export const useLowPowerStore = defineStore('lowPower', () => {
  const stored = readStorage(LOW_POWER_STORAGE_KEY);
  const preference = ref<LowPowerPreference>(
    isLowPowerPreference(stored) ? stored : DEFAULT_LOW_POWER,
  );
  /** Read once: memory and cores do not change during a visit, and a reload picks up a new Save-Data. */
  const hints = readDeviceHints(typeof navigator === 'undefined' ? undefined : navigator);
  const isWeak = isWeakDevice(hints);
  const isOn = computed(() => resolveLowPower(preference.value, hints));

  function choose(next: LowPowerPreference) {
    preference.value = next;
    writeStorage(LOW_POWER_STORAGE_KEY, next);
  }

  watch(isOn, paintLowPower, { immediate: true });
  return { preference, isOn, isWeak, choose };
});
