import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { nextVote, scoreAfterVote, voteRefusalKey } from './vote-rules';

describe('votes', () => {
  it('pressing an arrow votes that way, pressing the pressed arrow withdraws', () => {
    expect(nextVote(0, 1)).toBe(1);
    expect(nextVote(1, 1)).toBe(0);
    expect(nextVote(1, -1)).toBe(-1);
  });
  it('moves the score by the change of the viewer’s vote', () => {
    expect(scoreAfterVote(58, 0, 1)).toBe(59);
    expect(scoreAfterVote(59, 1, -1)).toBe(57);
    expect(scoreAfterVote(57, -1, 0)).toBe(58);
  });
  it('explains the interaction gate, the rate limit and anything else by code', () => {
    expect(voteRefusalKey(new ApiError('forbidden', 403, 'x'))).toBe('vote.refusedGate');
    expect(voteRefusalKey(new ApiError('rate_limited', 429, 'x'))).toBe('vote.refusedRate');
    expect(voteRefusalKey(new ApiError('not_found', 404, 'x'))).toBe('errors.not_found');
  });
});
