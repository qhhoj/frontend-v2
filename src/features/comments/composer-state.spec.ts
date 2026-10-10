import { describe, expect, it } from 'vitest';
import { COMMENT_REPLY_WINDOW_MS } from '@/api/types/comments';
import { canReplyTo, composerStateOf } from './composer-state';

describe('composerStateOf', () => {
  it('offers the composer to a signed-in viewer the page lets comment', () => {
    expect(composerStateOf(true, { locked: false, canComment: true })).toBe('ready');
  });
  it('asks a signed-out viewer to sign in', () => {
    expect(composerStateOf(false, { locked: false, canComment: false })).toBe('signedOut');
  });
  it('explains the gate to a signed-in viewer the backend refuses on an open page', () => {
    expect(composerStateOf(true, { locked: false, canComment: false })).toBe('gated');
  });
  it('says the page is locked to everyone, signed in or not', () => {
    expect(composerStateOf(true, { locked: true, canComment: false })).toBe('locked');
    expect(composerStateOf(false, { locked: true, canComment: false })).toBe('locked');
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
