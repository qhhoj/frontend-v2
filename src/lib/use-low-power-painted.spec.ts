import { describe, expect, it, vi } from 'vitest';
import { isLowPowerPainted, useLowPowerPainted } from './use-low-power-painted';

describe('useLowPowerPainted', () => {
  it('follows the data-low-power attribute on <html>', async () => {
    const painted = useLowPowerPainted();
    expect(painted.value).toBe(false);
    document.documentElement.dataset.lowPower = '';
    await vi.waitFor(() => expect(painted.value).toBe(true));
    delete document.documentElement.dataset.lowPower;
    await vi.waitFor(() => expect(painted.value).toBe(false));
  });

  it('is one shared ref for every caller', () => {
    expect(useLowPowerPainted()).toBe(useLowPowerPainted());
  });

  it('reads the attribute directly', () => {
    document.documentElement.dataset.lowPower = '';
    expect(isLowPowerPainted()).toBe(true);
  });
});
