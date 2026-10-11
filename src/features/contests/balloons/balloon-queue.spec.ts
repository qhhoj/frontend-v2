import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { balloonStateOf, deliveryFailureKey, labelIndex } from './balloon-queue';

describe('balloon queue helpers', () => {
  it('reads the state from the URL, pending by default', () => {
    expect(['pending', 'delivered', 'all'].map(balloonStateOf)).toEqual([
      'pending',
      'delivered',
      'all',
    ]);
    expect([undefined, 'done', ['all']].map(balloonStateOf)).toEqual([
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('orders letters and numbers as the contest labels them', () => {
    expect(['A', 'B', 'Z', 'AA', '1', '12'].map(labelIndex)).toEqual([0, 1, 25, 26, 0, 11]);
    expect(labelIndex('')).toBeNull();
    expect(labelIndex('A1')).toBeNull();
  });

  it('maps a 404 balloon_not_found by its issue code, like the backend sends it', () => {
    const missing = new ApiError('not_found', 404, 'x', {
      issues: [{ field: 'problemId', code: 'balloon_not_found', message: 'English text' }],
    });
    expect(deliveryFailureKey(missing)).toBe('errors.balloon_not_found');
    expect(deliveryFailureKey(new ApiError('not_found', 404, 'x'))).toBe('errors.not_found');
  });

  it('tells the two delivery conflicts apart by issue code and falls back to the status code text', () => {
    const conflict = (code: string) =>
      new ApiError('conflict', 409, 'x', { issues: [{ field: 'balloon', code, message: 'x' }] });
    expect(deliveryFailureKey(conflict('already_delivered'))).toBe('errors.already_delivered');
    expect(deliveryFailureKey(conflict('not_delivered'))).toBe('errors.not_delivered');
    expect(deliveryFailureKey(new ApiError('conflict', 409, 'x'))).toBe('errors.conflict');
    expect(deliveryFailureKey(new ApiError('rate_limited', 429, 'x'))).toBe('errors.rate_limited');
    expect(deliveryFailureKey(new Error('boom'))).toBe('errors.generic');
  });
});
