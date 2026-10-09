import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { decisionFailureText, isAlreadyDecided } from './join-request-decision';

const refusal = (status: number, field: string, code: string) =>
  new ApiError(status === 409 ? 'conflict' : 'forbidden', status, 'English message', {
    issues: [{ field, code, message: 'English message' }],
  });

describe('decisionFailureText', () => {
  it('says another staff member decided the request first', () => {
    const error = refusal(409, 'state', 'request_already_decided');
    expect(isAlreadyDecided(error)).toBe(true);
    expect(decisionFailureText(error)).toBe('Yêu cầu này đã được người khác xử lý.');
  });

  it('says the organization is full only for the full code', () => {
    expect(decisionFailureText(refusal(409, 'organization', 'organization_full'))).toBe(
      'Tổ chức đã đủ chỗ.',
    );
  });

  it('does not call the decision-lock 409 "full" or "already decided"', () => {
    const busy = refusal(409, 'lock', 'busy');
    expect(isAlreadyDecided(busy)).toBe(false);
    expect(decisionFailureText(busy)).toBe('Đang có thao tác khác chạy; hãy chờ xong rồi thử lại.');
  });

  it('ignores the English message: the code alone decides', () => {
    const lookalike = new ApiError('conflict', 409, 'This request has already been decided');
    expect(isAlreadyDecided(lookalike)).toBe(false);
  });
});
