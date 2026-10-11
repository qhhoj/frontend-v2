import { describe, expect, it, vi } from 'vitest';
import { useLowPowerPainted } from './use-low-power-painted';

describe('useLowPowerPainted', () => {
  it('follows the data-low-power attribute on <html>', async () => {
    const painted = useLowPowerPainted();
    expect(painted.value).toBe(false);
    document.documentElement.dataset.lowPower = '';
    await vi.waitFor(() => expect(painted.value).toBe(true));
    delete document.documentElement.dataset.lowPower;
    await vi.waitFor(() => expect(painted.value).toBe(false));
  });
});
