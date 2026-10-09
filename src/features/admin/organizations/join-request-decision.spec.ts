import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { decisionFailureText, isAlreadyDecided } from './join-request-decision';

const conflict = (message: string) => new ApiError('conflict', 409, message);

describe('decisionFailureText', () => {
  it('says another staff member decided the request first', () => {
    const error = conflict('This request has already been decided');
    expect(isAlreadyDecided(error)).toBe(true);
    expect(decisionFailureText(error)).toBe('Yêu cầu này đã được người khác xử lý.');
  });

  it('says the organization is full only for the full refusal', () => {
    expect(decisionFailureText(conflict('The organization is full'))).toBe('Tổ chức đã đủ chỗ.');
  });

  it('does not call the decision-lock 409 "full" or "already decided"', () => {
    const busy = conflict('Another decision is being made; try again');
    expect(isAlreadyDecided(busy)).toBe(false);
    expect(decisionFailureText(busy)).not.toBe('Tổ chức đã đủ chỗ.');
    expect(decisionFailureText(busy)).not.toBe('Yêu cầu này đã được người khác xử lý.');
  });

  it('does not match the messages under another status', () => {
    expect(
      isAlreadyDecided(new ApiError('forbidden', 403, 'This request has already been decided')),
    ).toBe(false);
  });
});
