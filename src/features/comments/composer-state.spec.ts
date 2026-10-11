import { describe, expect, it } from 'vitest';
import { COMMENT_REPLY_WINDOW_MS } from '@/api/types/comments';
import type { CommentPostBlockReason } from '@/api/types/comments';
import { canReplyTo, composerStateOf, solvedPercent } from './composer-state';

describe('composerStateOf', () => {
  const open = { locked: false, postBlock: null };
  const block = (reason: CommentPostBlockReason, locked = false) => ({
    locked,
    postBlock: { reason, solved: null, required: null },
  });
  it('offers the composer to a signed-in viewer nothing blocks', () => {
    expect(composerStateOf(true, open)).toBe('ready');
  });
  it('names the panel after the reason posting would refuse', () => {
    expect(composerStateOf(true, block('needs_solved'))).toBe('needsSolved');
    expect(composerStateOf(true, block('muted'))).toBe('muted');
    expect(composerStateOf(true, block('locked', true))).toBe('locked');
    expect(composerStateOf(true, block('contest', true))).toBe('contest');
  });
  it('asks a signed-out viewer to sign in, unless the page is locked', () => {
    expect(composerStateOf(false, block('signed_out'))).toBe('signedOut');
    expect(composerStateOf(false, open)).toBe('signedOut');
    expect(composerStateOf(false, block('signed_out', true))).toBe('locked');
  });
});

describe('solvedPercent', () => {
  it('fills the bar by the share solved', () => {
    expect(solvedPercent(3, 5)).toBe(60);
  });
  it('stays within 0..100', () => {
    expect(solvedPercent(9, 5)).toBe(100);
    expect(solvedPercent(-1, 5)).toBe(0);
    expect(solvedPercent(0, 0)).toBe(100);
  });
});

describe('canReplyTo', () => {
  const now = Date.parse('2026-10-10T00:00:00Z');
  const aged = (ms: number) => new Date(now - ms).toISOString();
  it('takes replies within a year', () => {
    expect(canReplyTo(aged(COMMENT_REPLY_WINDOW_MS - 1000), now, false)).toBe(true);
  });
  it('refuses replies to a comment a year old, except from a moderator', () => {
    expect(canReplyTo(aged(COMMENT_REPLY_WINDOW_MS), now, false)).toBe(false);
    expect(canReplyTo(aged(COMMENT_REPLY_WINDOW_MS * 3), now, true)).toBe(true);
  });
});
