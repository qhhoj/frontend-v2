import { describe, expect, it } from 'vitest';
import { dataExportStatus } from '@/test/fixtures';
import { daysLeft, exportFileOf, requestRuleOf, timeLeft } from './data-export';

const AT = '2026-10-08T09:12:00Z';

describe('exportFileOf', () => {
  it.each([
    [dataExportStatus(), { kind: 'none' }],
    [dataExportStatus({ preparedAt: AT }), { kind: 'expired' }],
    [
      dataExportStatus({ state: 'preparing', preparedAt: AT }),
      { kind: 'preparing', requestedAt: AT },
    ],
    [
      dataExportStatus({
        state: 'ready',
        preparedAt: AT,
        readyAt: AT,
        expiresAt: AT,
        size: 19_293_798,
      }),
      { kind: 'ready', size: 19_293_798, readyAt: AT, expiresAt: AT },
    ],
  ])('reads %j as %j', (status, file) => {
    expect(exportFileOf(status)).toEqual(file);
  });
});

describe('requestRuleOf', () => {
  it('waits for a running job, then for the once-a-day rule, else the daily limit is used up', () => {
    expect(requestRuleOf(dataExportStatus({ state: 'preparing', canPrepare: false }))).toEqual({
      kind: 'preparing',
    });
    expect(requestRuleOf(dataExportStatus({ canPrepare: false, nextPrepareAt: AT }))).toEqual({
      kind: 'wait',
      until: AT,
    });
    expect(requestRuleOf(dataExportStatus({ canPrepare: false }))).toEqual({
      kind: 'dailyLimit',
    });
  });
});

describe('timeLeft and daysLeft', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');
  it('rounds the wait up to the minute and never goes negative', () => {
    const until = new Date(now + (21 * 60 + 14) * 60_000 - 30_000).toISOString();
    expect(timeLeft(until, now)).toEqual({ hours: 21, minutes: 14 });
    expect(timeLeft('2026-10-08T11:00:00Z', now)).toEqual({ hours: 0, minutes: 0 });
  });

  it('counts whole days left, at least zero', () => {
    expect(daysLeft('2026-10-15T12:00:00Z', now)).toBe(7);
    expect(daysLeft('2026-10-01T12:00:00Z', now)).toBe(0);
  });
});
