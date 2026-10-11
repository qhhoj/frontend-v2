import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { decisionFailureText, isAlreadyDecided } from './join-request-decision';

const refusal = (status: number, field: string, code: string) =>
  new ApiError(status === 409 ? 'conflict' : 'forbidden', status, 'English message', {
    issues: [{ field, code, message: 'English message' }],
  });

describe('decisionFailureText', () => {
  it('words each 409 by its code alone, never calling the decision-lock "full" or "already decided"', () => {
    const decided = refusal(409, 'state', 'request_already_decided');
    expect(isAlreadyDecided(decided)).toBe(true);
    expect(decisionFailureText(decided)).toBe('Yêu cầu này đã được người khác xử lý.');
    expect(decisionFailureText(refusal(409, 'organization', 'organization_full'))).toBe(
      'Tổ chức đã đủ chỗ.',
    );
    const busy = refusal(409, 'lock', 'busy');
    expect(isAlreadyDecided(busy)).toBe(false);
    expect(decisionFailureText(busy)).toBe('Đang có thao tác khác chạy; hãy chờ xong rồi thử lại.');
    const lookalike = new ApiError('conflict', 409, 'This request has already been decided');
    expect(isAlreadyDecided(lookalike)).toBe(false);
  });
});
