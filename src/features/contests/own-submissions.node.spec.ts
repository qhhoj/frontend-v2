import { describe, expect, it } from 'vitest';
import { contestDetail, contestViewer } from '@/test/fixtures';
import { ownSubmissionsOnly } from './own-submissions';

const RUNNING = Date.parse('2026-10-08T09:00:00Z'); // before the 10:24:37Z freeze
const FROZEN = Date.parse('2026-10-08T10:30:00Z');
const AFTER = Date.parse('2026-10-09T00:00:00Z');

describe('ownSubmissionsOnly (until backend ask B-8d1)', () => {
  it('is true while a contest runs without a public submission list', () =>
    expect(ownSubmissionsOnly(contestDetail(), RUNNING)).toBe(true));
  it('is false while it runs with a public list, and true once the board freezes', () => {
    const open = contestDetail({ showSubmissionList: true });
    expect(ownSubmissionsOnly(open, RUNNING)).toBe(false);
    expect(ownSubmissionsOnly(open, FROZEN)).toBe(true);
  });
  it('stays narrowed after the end while a freeze holds, and opens after the end without one', () => {
    expect(ownSubmissionsOnly(contestDetail({ phase: 'ended' }), AFTER)).toBe(true);
    expect(ownSubmissionsOnly(contestDetail({ phase: 'ended', frozenLastMinutes: 0 }), AFTER)).toBe(
      false,
    );
  });
  it('follows a hidden scoreboard: H always, C and P until the end', () => {
    expect(
      ownSubmissionsOnly(
        contestDetail({ phase: 'ended', frozenLastMinutes: 0, scoreboardVisibility: 'H' }),
        AFTER,
      ),
    ).toBe(true);
    expect(
      ownSubmissionsOnly(
        contestDetail({ phase: 'ended', frozenLastMinutes: 0, scoreboardVisibility: 'C' }),
        AFTER,
      ),
    ).toBe(false);
    expect(
      ownSubmissionsOnly(
        contestDetail({ showSubmissionList: true, scoreboardVisibility: 'P' }),
        RUNNING,
      ),
    ).toBe(true);
  });
  it('never narrows an editor', () =>
    expect(
      ownSubmissionsOnly(contestDetail({ viewer: contestViewer({ canEdit: true }) }), FROZEN),
    ).toBe(false));
});
