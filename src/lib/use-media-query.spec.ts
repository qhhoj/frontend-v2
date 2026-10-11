import { effectScope } from 'vue';
import { describe, expect, it } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { PHONE_QUERY, useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('stops listening once its scope is disposed', () => {
    const media = stubMatchMedia();
    const scope = effectScope();
    const matches = scope.run(() => useMediaQuery(PHONE_QUERY))!;
    scope.stop();
    media.setQuery(PHONE_QUERY, true);
    expect(matches.value).toBe(false);
  });
});
