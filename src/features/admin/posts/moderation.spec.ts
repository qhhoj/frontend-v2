import { describe, expect, it } from 'vitest';
import { feedFromQuery, isQueueFeed } from './moderation';

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

describe('isQueueFeed', () => {
  it('is true for the two moderation queues only', () => {
    expect(
      ['all', 'global', 'hidden', 'scheduled'].map((feed) => isQueueFeed(feed as never)),
    ).toEqual([false, false, true, true]);
  });
});
