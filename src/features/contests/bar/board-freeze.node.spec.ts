import { describe, expect, it } from 'vitest';
import { contestDetail, contestViewer } from '@/test/fixtures';
import { boardFreezeOf } from './board-freeze';

const START = Date.parse('2026-10-08T08:00:00Z');
const END = Date.parse('2026-10-08T11:00:00Z');
const contest = (viewer = contestViewer()) =>
  contestDetail({
    startTime: new Date(START).toISOString(),
    endTime: new Date(END).toISOString(),
    formatName: 'icpc',
    frozenLastMinutes: 60,
    viewer,
  });
const BEFORE_FREEZE = END - 90 * 60_000;
const IN_FREEZE = END - 30 * 60_000;
const AFTER_END = END + 60_000;

describe('board freeze chip', () => {
  it('follows the board the page shows when it has one', () => {
    expect(boardFreezeOf(contest(), IN_FREEZE, false)).toBeNull();
    expect(boardFreezeOf(contest(), BEFORE_FREEZE, true)?.labelKey).toBe('ranking.freeze.label');
  });

  it('says frozen from the freeze minute while running, and results pending after the end', () => {
    expect(boardFreezeOf(contest(), BEFORE_FREEZE)).toBeNull();
    expect(boardFreezeOf(contest(), IN_FREEZE)?.labelKey).toBe('ranking.freeze.label');
    const frozen = contest(contestViewer({ boardFrozenAt: new Date(IN_FREEZE).toISOString() }));
    expect(boardFreezeOf(frozen, AFTER_END)?.labelKey).toBe('ranking.freeze.pendingLabel');
  });

  it('shows nothing to an editor, who reads the live board', () => {
    expect(boardFreezeOf(contest(contestViewer({ canEdit: true })), IN_FREEZE)).toBeNull();
  });

  it('shows nothing after the end once the detail says the board is open', () => {
    expect(boardFreezeOf(contest(), AFTER_END)).toBeNull();
  });
});
