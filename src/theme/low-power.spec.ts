import { describe, expect, it } from 'vitest';
import { isLowPowerPreference, isWeakDevice, readDeviceHints, resolveLowPower } from './low-power';

describe('resolveLowPower', () => {
  it.each([
    ['on', {}, true],
    ['on', { deviceMemory: 16, hardwareConcurrency: 16 }, true],
    ['off', { deviceMemory: 1, hardwareConcurrency: 1, saveData: true }, false],
    ['auto', {}, false],
    ['auto', { deviceMemory: 8, hardwareConcurrency: 8 }, false],
    ['auto', { deviceMemory: 2 }, true],
    ['auto', { deviceMemory: 2.5 }, false],
    ['auto', { hardwareConcurrency: 2 }, true],
    ['auto', { hardwareConcurrency: 3 }, false],
    ['auto', { saveData: true }, true],
    ['auto', { saveData: false, deviceMemory: 4 }, false],
  ] as const)('%s with %j is %s', (preference, hints, expected) => {
    expect(resolveLowPower(preference, hints)).toBe(expected);
  });
});

describe('readDeviceHints', () => {
  it('keeps numbers and a true Save-Data, and drops anything else (Firefox and Safari have no deviceMemory)', () => {
    expect(
      readDeviceHints({ deviceMemory: 4, hardwareConcurrency: 8, connection: { saveData: true } }),
    ).toEqual({ deviceMemory: 4, hardwareConcurrency: 8, saveData: true });
    expect(
      readDeviceHints({ deviceMemory: null, hardwareConcurrency: '2', connection: null }),
    ).toEqual({
      deviceMemory: undefined,
      hardwareConcurrency: undefined,
      saveData: false,
    });
    expect(readDeviceHints(undefined)).toEqual({
      deviceMemory: undefined,
      hardwareConcurrency: undefined,
      saveData: false,
    });
  });

  it('never calls a device weak on missing hints', () => {
    expect(isWeakDevice(readDeviceHints({ deviceMemory: null }))).toBe(false);
    // Hints that bypass readDeviceHints (null is <= 2 in JavaScript) must not count either.
    expect(isWeakDevice({ deviceMemory: null as unknown as number })).toBe(false);
  });
});

describe('isLowPowerPreference', () => {
  it.each([
    ['auto', true],
    ['on', true],
    ['off', true],
    ['turbo', false],
    [null, false],
    ['constructor', false],
  ])('%j is %s', (value, expected) => {
    expect(isLowPowerPreference(value)).toBe(expected);
  });
});
