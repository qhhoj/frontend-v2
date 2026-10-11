import { ApiError } from '@/api/client';
import {
  COMMENT_MAX_LENGTH,
  COMMENT_RATE_LIMIT,
  COMMENT_RATE_WINDOW_MINUTES,
} from '@/api/types/comments';
import { errorMessageKey } from '@/i18n/error-message';

/** The line a refused post or edit shows; `refreshesPage`: the refusal means the page changed (lock, gate, edit elsewhere), so it is fetched again. */
export interface CommentFailure {
  key: string;
  params: Record<string, number>;
  refreshesPage: boolean;
}

const failure = (key: string, params: Record<string, number> = {}, refreshesPage = false) => ({
  key,
  params,
  refreshesPage,
});

/** 429 the post rate (with the wait when the server sent one), 403 a lock, the reply window or the gate, 409 an edit made meanwhile, 404 a parent gone. */
export function commentFailureOf(error: unknown): CommentFailure {
  if (!(error instanceof ApiError)) return failure(errorMessageKey(error));
  const rate = { limit: COMMENT_RATE_LIMIT, minutes: COMMENT_RATE_WINDOW_MINUTES };
  switch (error.code) {
    case 'rate_limited':
      return error.retryAfterSeconds
        ? failure('comments.failure.rateLimitedWait', { ...rate, seconds: error.retryAfterSeconds })
        : failure('comments.failure.rateLimited', rate);
    case 'forbidden':
      return failure('comments.failure.forbidden', {}, true);
    case 'conflict':
      return failure('comments.failure.conflict', {}, true);
    case 'not_found':
      return failure('comments.failure.gone', {}, true);
    case 'validation_failed':
      return failure('comments.failure.invalid', { max: COMMENT_MAX_LENGTH });
    default:
      return failure(errorMessageKey(error));
  }
}

/** The line a refused report shows: already reported (409), too many reports (429), the comment gone (404), one's own (403). */
export function reportFailureKey(error: unknown): string {
  if (!(error instanceof ApiError)) return errorMessageKey(error);
  switch (error.code) {
    case 'conflict':
      return 'comments.report.already';
    case 'rate_limited':
      return 'comments.report.rateLimited';
    case 'not_found':
      return 'comments.report.gone';
    case 'forbidden':
      return 'comments.report.own';
    default:
      return errorMessageKey(error);
  }
}
