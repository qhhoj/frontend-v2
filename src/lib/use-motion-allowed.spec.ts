import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { stubMatchMedia } from '@/test/match-media';
import { useMotionAllowed } from './use-motion-allowed';

describe('useMotionAllowed', () => {
  it('allows motion by default and stops at once when reduced motion is requested', async () => {
    const media = stubMatchMedia();
    const allowed = useMotionAllowed();
    expect(allowed.value).toBe(true);
    media.setReducedMotion(true);
    await nextTick();
    expect(allowed.value).toBe(false);
  });
});
