import { ApiError } from '@/api/client';

export interface RetryOptions {
  /** Tries in all, the first included. */
  attempts: number;
  /** Wait before the second try; doubled before each later one. */
  baseDelayMs: number;
  signal?: AbortSignal;
  /** Injected by specs. */
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A dropped connection (`network_error`; an abort is not one), a server or gateway error, a rate limit or a busy lock can pass on a later try; any other answer will not. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const isBusy = error.status === 409 && error.issues.some((issue) => issue.code === 'busy');
  return error.code === 'network_error' || error.status >= 500 || error.status === 429 || isBusy;
}

/** Runs `task` until it succeeds, a refusal is final, the tries run out or `signal` aborts; backs off exponentially. */
export async function withRetry<Result>(
  task: () => Promise<Result>,
  { attempts, baseDelayMs, signal, wait = sleep }: RetryOptions,
): Promise<Result> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (signal?.aborted || attempt >= attempts || !isRetryable(error)) throw error;
      await wait(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
