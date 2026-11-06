import { ApiError } from '@/api/client';

export interface RetryOptions {
  /** Tries in all, the first included. */
  attempts: number;
  /** Wait before the second try; doubled before each later one. */
  baseDelayMs: number;
  signal?: AbortSignal;
  /** Injected by specs. */
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/** A `Retry-After` longer than this ends the retries at once: the budget will not come back while the user watches. */
const MAX_RETRY_AFTER_SECONDS = 60;

/** Resolves after `ms`, or rejects with the signal's reason as soon as it aborts. */
export function abortableWait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason as Error);
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal!.reason as Error);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** 409 `busy`: the upload's lock is held by a chunk, its completion or a cancel. */
export const isBusy = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.status === 409 &&
  error.issues.some((issue) => issue.code === 'busy');

/** A dropped connection (`network_error`; an abort is not one), a server or gateway error, a rate limit or a busy lock can pass on a later try; any other answer will not. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.code === 'network_error' || error.status >= 500 || error.status === 429 || isBusy(error)
  );
}

/** The wait before try `attempt + 1`: the backoff, or the server's `Retry-After` when longer; null when that is too long to wait for. */
function delayBefore(error: unknown, attempt: number, baseDelayMs: number): number | null {
  const backoff = baseDelayMs * 2 ** (attempt - 1);
  const retryAfter = error instanceof ApiError ? error.retryAfterSeconds : null;
  if (retryAfter === null) return backoff;
  return retryAfter > MAX_RETRY_AFTER_SECONDS ? null : Math.max(backoff, retryAfter * 1000);
}

/** Runs `task` until it succeeds, a refusal is final, the tries run out or `signal` aborts (also during a wait); backs off exponentially. */
export async function withRetry<Result>(
  task: () => Promise<Result>,
  { attempts, baseDelayMs, signal, wait = abortableWait }: RetryOptions,
): Promise<Result> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (signal?.aborted || attempt >= attempts || !isRetryable(error)) throw error;
      const delay = delayBefore(error, attempt, baseDelayMs);
      if (delay === null) throw error;
      await wait(delay, signal);
    }
  }
}
