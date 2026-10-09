/** Device-local low-power preference (board M10C). Keep `index.html`'s pre-paint script in step; prepaint.spec.ts checks it. */
export const LOW_POWER_PREFERENCES = ['auto', 'on', 'off'] as const;
export type LowPowerPreference = (typeof LOW_POWER_PREFERENCES)[number];
export const DEFAULT_LOW_POWER: LowPowerPreference = 'auto';
export const LOW_POWER_STORAGE_KEY = 'qhhoj.lowPower';
/** `auto` turns on at or below these: "≤ 2 GB bộ nhớ, ≤ 2 nhân CPU". */
export const WEAK_DEVICE_MEMORY_GB = 2;
export const WEAK_CPU_CORES = 2;

export interface DeviceHints {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}
/** What `navigator` may carry: `deviceMemory` and `connection` exist in Chromium only. */
export interface HintSource {
  deviceMemory?: unknown;
  hardwareConcurrency?: unknown;
  connection?: { saveData?: unknown } | null;
}

export const isLowPowerPreference = (value: unknown): value is LowPowerPreference =>
  typeof value === 'string' && (LOW_POWER_PREFERENCES as readonly string[]).includes(value);

/** `null <= 2` is true in JavaScript, so only real numbers count. */
const isAtMost = (value: number | undefined, limit: number) =>
  typeof value === 'number' && value <= limit;

export const isWeakDevice = (hints: DeviceHints): boolean =>
  isAtMost(hints.deviceMemory, WEAK_DEVICE_MEMORY_GB) ||
  isAtMost(hints.hardwareConcurrency, WEAK_CPU_CORES) ||
  hints.saveData === true;

export function resolveLowPower(preference: LowPowerPreference, hints: DeviceHints): boolean {
  if (preference === 'on') return true;
  if (preference === 'off') return false;
  return isWeakDevice(hints);
}

const numberOrUndefined = (value: unknown) => (typeof value === 'number' ? value : undefined);

export function readDeviceHints(source: HintSource | undefined): DeviceHints {
  return {
    deviceMemory: numberOrUndefined(source?.deviceMemory),
    hardwareConcurrency: numberOrUndefined(source?.hardwareConcurrency),
    saveData: source?.connection?.saveData === true,
  };
}
