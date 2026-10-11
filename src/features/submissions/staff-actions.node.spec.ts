import { describe, expect, it } from 'vitest';
import { submissionDetail } from '@/test/fixtures';
import { hasAnyStaffAction, lockLineOf, staffActionsFor } from './staff-actions';

const NOW = new Date('2026-10-08T12:00:00.000Z').getTime();
const can = (permissions: string[]) => (permission: string) => permissions.includes(permission);
const flags = (overrides: Partial<ReturnType<typeof submissionDetail>['viewer']> = {}) => ({
  canAbort: false,
  canRejudge: false,
  canReject: false,
  canLock: false,
  ...overrides,
});
const ALL = ['judge.rejudge_submission', 'judge.reject_submission', 'judge.abort_any_submission'];

describe('staff actions', () => {
  it('is ready exactly where the server flag says so, whatever the permission list', () => {
    const finished = submissionDetail({
      status: 'D',
      result: 'TLE',
      viewer: flags({ canRejudge: true, canReject: true }),
    });
    expect(staffActionsFor(finished, can([]), NOW)).toEqual({
      rejudge: 'ready',
      reject: 'ready',
      abort: 'hidden',
    });
  });

  it('offers abort while judging and keeps rejudge and reject waiting for a holder of their permissions', () => {
    const running = submissionDetail({
      status: 'G',
      result: null,
      viewer: flags({ canAbort: true }),
    });
    expect(staffActionsFor(running, can(ALL), NOW)).toEqual({
      rejudge: 'waiting',
      reject: 'waiting',
      abort: 'ready',
    });
  });

  it('keeps abort waiting on a finished submission for a holder of the abort permission', () => {
    const finished = submissionDetail({ status: 'D', viewer: flags({ canReject: true }) });
    expect(staffActionsFor(finished, can(ALL), NOW).abort).toBe('waiting');
    expect(staffActionsFor(finished, can([]), NOW).abort).toBe('hidden');
  });

  it('hides what the account may not do and what the flag refuses', () => {
    const finished = submissionDetail({ status: 'D', viewer: flags({ canReject: true }) });
    expect(staffActionsFor(finished, can(['judge.reject_submission']), NOW)).toEqual({
      rejudge: 'hidden',
      reject: 'ready',
      abort: 'hidden',
    });
    expect(hasAnyStaffAction(staffActionsFor(submissionDetail(), can([]), NOW))).toBe(false);
  });

  it('shows rejudge as locked once the lock time has passed, and says since when', () => {
    const locked = submissionDetail({
      status: 'D',
      lockedAfter: '2026-10-08T11:00:00.000Z',
      viewer: flags(),
    });
    expect(staffActionsFor(locked, can(ALL), NOW).rejudge).toBe('locked');
    expect(lockLineOf(locked, NOW)).toEqual({ key: 'since', time: '2026-10-08T11:00:00.000Z' });
    const later = submissionDetail({
      status: 'D',
      lockedAfter: '2026-10-08T18:00:00.000Z',
      viewer: flags({ canRejudge: true }),
    });
    expect(staffActionsFor(later, can(ALL), NOW).rejudge).toBe('ready');
    expect(lockLineOf(later, NOW)).toEqual({ key: 'at', time: '2026-10-08T18:00:00.000Z' });
    expect(lockLineOf(submissionDetail(), NOW)).toBeNull();
  });
});
