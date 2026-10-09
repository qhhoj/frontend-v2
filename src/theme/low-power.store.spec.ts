import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useLowPowerStore } from './low-power.store';

const painted = () => document.documentElement.hasAttribute('data-low-power');
const startStore = () => {
  setActivePinia(createPinia());
  return useLowPowerStore();
};
const weakDevice = () =>
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });

describe('useLowPowerStore', () => {
  it('starts on auto, off on a strong device, with no attribute', () => {
    const store = startStore();
    expect(store.preference).toBe('auto');
    expect(store.isOn).toBe(false);
    expect(painted()).toBe(false);
  });

  it('turns on by itself on a weak device and paints the attribute at once', () => {
    weakDevice();
    const store = startStore();
    expect(store.isWeak).toBe(true);
    expect(store.isOn).toBe(true);
    expect(painted()).toBe(true);
  });

  it('stores a choice on this device and repaints', async () => {
    const store = startStore();
    store.choose('on');
    await nextTick();
    expect(localStorage.getItem('qhhoj.lowPower')).toBe('on');
    expect(painted()).toBe(true);
    store.choose('off');
    await nextTick();
    expect(painted()).toBe(false);
  });

  it('keeps "off" on a weak device', () => {
    weakDevice();
    localStorage.setItem('qhhoj.lowPower', 'off');
    expect(startStore().isOn).toBe(false);
    expect(painted()).toBe(false);
  });

  it('reads an unknown stored value as auto', () => {
    localStorage.setItem('qhhoj.lowPower', 'turbo');
    expect(startStore().preference).toBe('auto');
  });
});
