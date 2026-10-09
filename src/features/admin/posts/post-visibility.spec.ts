import { describe, expect, it } from 'vitest';
import { unhidePlanOf } from './post-visibility';

const NOW = Date.parse('2026-10-09T08:00:00Z');

describe('unhide plan', () => {
  it.each([
    ['a publish time in the past', '2026-10-06T22:10:00Z', false],
    ['exactly now', '2026-10-09T08:00:00Z', false],
    ['one second ahead', '2026-10-09T08:00:01Z', true],
    ['a date weeks ahead', '2026-12-01T00:00:00Z', true],
  ])('%s: scheduled=%s', (_label, publishOn, scheduled) => {
    expect(unhidePlanOf({ publishOn }, NOW)).toEqual({ scheduled });
  });
});
