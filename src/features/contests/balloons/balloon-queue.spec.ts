import { describe, expect, it } from 'vitest';
import { balloon } from '@/test/contest-extras-fixtures';
import { ApiError } from '@/api/client';
import {
  balloonRowId,
  balloonStateOf,
  deliveryFailureKey,
  isDelivered,
  labelIndex,
  solvedAtText,
  swatchClassOf,
} from './balloon-queue';

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

  it('gives each problem label its own tag colour, cycling, and a neutral swatch for an odd label', () => {
    expect(swatchClassOf('I')).toBe(swatchClassOf('A'));
    expect(swatchClassOf('A')).not.toBe(swatchClassOf('B'));
    expect(swatchClassOf('3')).toBe(swatchClassOf('C'));
    expect(swatchClassOf('?')).not.toBe(swatchClassOf('A'));
    expect(swatchClassOf('?')).not.toContain('tag-');
  });

  it('writes the solve time from the team start, or a dash when it is hidden', () => {
    expect(solvedAtText(3840)).toBe('1:04:00');
    expect(solvedAtText(null)).toBe('—');
  });

  it('identifies a row by team and problem, and knows a delivered one', () => {
    expect(balloonRowId(balloon(0))).toBe('part-00:prob-a');
    expect(isDelivered(balloon(0))).toBe(false);
    expect(isDelivered(balloon(0, { deliveredAt: '2026-10-08T09:00:00.000Z' }))).toBe(true);
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
