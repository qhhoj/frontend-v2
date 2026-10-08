import { effectScope } from 'vue';
import { describe, expect, it } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
  it('reads the preference and follows a change', () => {
    const media = stubMatchMedia({ reducedMotion: true });
    const reduced = effectScope().run(() => useReducedMotion())!;
    expect(reduced.value).toBe(true);
    media.setReducedMotion(false);
    expect(reduced.value).toBe(false);
  });

  it('is false without matchMedia', () => {
    stubMatchMedia();
    globalThis.matchMedia = undefined as unknown as typeof matchMedia;
    expect(effectScope().run(() => useReducedMotion())!.value).toBe(false);
  });
});
