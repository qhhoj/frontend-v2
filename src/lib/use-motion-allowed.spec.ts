import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { stubMatchMedia } from '@/test/match-media';
import { LOW_POWER_ATTRIBUTE } from './use-low-power-painted';
import { useMotionAllowed } from './use-motion-allowed';

describe('useMotionAllowed', () => {
  afterEach(() => document.documentElement.removeAttribute(LOW_POWER_ATTRIBUTE));

  it('allows motion by default and stops at once when reduced motion is requested', async () => {
    const media = stubMatchMedia();
    const allowed = useMotionAllowed();
    expect(allowed.value).toBe(true);
    media.setReducedMotion(true);
    await nextTick();
    expect(allowed.value).toBe(false);
  });

  it('stops while low-power is on and allows motion again once it is off', async () => {
    stubMatchMedia();
    const allowed = useMotionAllowed();
    document.documentElement.setAttribute(LOW_POWER_ATTRIBUTE, '');
    await vi.waitFor(() => expect(allowed.value).toBe(false));
    document.documentElement.removeAttribute(LOW_POWER_ATTRIBUTE);
    await vi.waitFor(() => expect(allowed.value).toBe(true));
  });
});
