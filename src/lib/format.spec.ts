import { describe, expect, it } from 'vitest';
import {
  coinIndex,
  formatDuration,
  formatElapsed,
  formatNumber,
  formatRelative,
  greetingKey,
  initials,
} from './format';

describe('format helpers', () => {
  it('formats a countdown with unbounded hours and never below zero', () => {
    expect(formatDuration(5077)).toBe('01:24:37');
    expect(formatDuration(14 * 86_400 - 1)).toBe('335:59:59');
    expect(formatDuration(-5)).toBe('00:00:00');
  });

  it('formats ranking times as H:MM from the start', () => {
    expect(formatElapsed(31 * 60 + 59)).toBe('0:31');
    expect(formatElapsed(2 * 3600 + 5 * 60)).toBe('2:05');
  });

  it('formats numbers per locale', () => {
    expect(formatNumber(386.4, 'vi', 1)).toBe('386,4');
    expect(formatNumber(386.4, 'en', 1)).toBe('386.4');
  });

  it('formats past dates relative to now', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatRelative('2026-10-08T09:58:00Z', now, 'en')).toBe('2 minutes ago');
    expect(formatRelative('2026-10-08T07:00:00Z', now, 'vi')).toBe('3 giờ trước');
  });

  it('greets by the time of day', () => {
    expect(greetingKey(5)).toBe('home.greeting.morning');
    expect(greetingKey(11)).toBe('home.greeting.afternoon');
    expect(greetingKey(18)).toBe('home.greeting.evening');
    expect(greetingKey(2)).toBe('home.greeting.evening');
  });

  it('takes the initials of the first two words', () => {
    expect(initials('Dãy con tăng dài nhất')).toBe('DC');
    expect(initials('  đường ')).toBe('Đ');
  });

  it('spreads the fixture codes over at least three of the six coins', () => {
    const seeds = ['aplusb', 'lis', 'knapsack2', 'fibo', 'lcs', 'dpbitree'];
    const coins = seeds.map(coinIndex);
    expect(coins.every((coin) => Number.isInteger(coin) && coin >= 0 && coin < 6)).toBe(true);
    expect(new Set(coins).size).toBeGreaterThanOrEqual(3);
  });
});
