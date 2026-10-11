import { describe, expect, it } from 'vitest';
import { meterPercent } from './quota';

describe('quota helpers', () => {
  it('treats a zero limit as full once anything is used', () => {
    expect(meterPercent({ used: 0, limit: 0 })).toEqual({ percent: 0, barPercent: 0 });
    expect(meterPercent({ used: 3, limit: 0 })).toEqual({ percent: 100, barPercent: 100 });
  });
});
