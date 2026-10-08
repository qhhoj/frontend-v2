import { effectScope } from 'vue';
import { describe, expect, it } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { PHONE_QUERY, useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('reflects the initial match and follows a change', () => {
    const media = stubMatchMedia();
    media.setQuery(PHONE_QUERY, true);
    const matches = effectScope().run(() => useMediaQuery(PHONE_QUERY))!;
    expect(matches.value).toBe(true);
    media.setQuery(PHONE_QUERY, false);
    expect(matches.value).toBe(false);
  });

  it('stops listening once its scope is disposed', () => {
    const media = stubMatchMedia();
    const scope = effectScope();
    const matches = scope.run(() => useMediaQuery(PHONE_QUERY))!;
    scope.stop();
    media.setQuery(PHONE_QUERY, true);
    expect(matches.value).toBe(false);
  });

  it('is false without matchMedia', () => {
    globalThis.matchMedia = undefined as unknown as typeof matchMedia;
    expect(effectScope().run(() => useMediaQuery(PHONE_QUERY))!.value).toBe(false);
  });
});
