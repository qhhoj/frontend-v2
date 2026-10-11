import { describe, expect, it } from 'vitest';
import { feedFromQuery } from './moderation';

describe('feedFromQuery', () => {
  it.each(['all', 'global', 'hidden', 'scheduled'])('keeps the known feed %s', (feed) => {
    expect(feedFromQuery(feed)).toBe(feed);
  });

  it.each([undefined, null, '', 'unknown', ['hidden'], 3])(
    'falls back to the default tab for %j',
    (value) => {
      expect(feedFromQuery(value)).toBe('all');
    },
  );
});
