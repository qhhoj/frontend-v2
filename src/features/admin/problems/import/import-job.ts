import { ApiError } from '@/api/client';

export type ImportPhase = 'queued' | 'running' | 'done' | 'failed';
export const IMPORT_POLL_MS = 2000;
/** BullMQ answers this state for a job it does not know (expired, removed, or never existed). */
export const UNKNOWN_STATE = 'unknown';
export const MAX_POLL_RETRIES = 5;
/** Why polling stopped for good. */
export type PollStop = 'notFound' | 'forbidden' | 'unknown' | 'gaveUp';

const PHASES: Record<string, ImportPhase> = {
  active: 'running',
  completed: 'done',
  failed: 'failed',
};
/** BullMQ states: waiting, delayed, prioritized, waiting-children (and any new one) all mean "not started yet". */
export const phaseOf = (state: string): ImportPhase => PHASES[state] ?? 'queued';
export const isFinal = (phase: ImportPhase) => phase === 'done' || phase === 'failed';

const STOP_BY_STATUS: Record<number, PollStop> = {
  404: 'notFound',
  401: 'forbidden',
  403: 'forbidden',
};
/** No connection, a rate limit or a server error may pass; the answer will not change by asking again otherwise. */
const isRetryableStatus = (status: number) => status === 0 || status === 429 || status >= 500;

/** The reason polling must stop for this error, or `null` when it is worth retrying. */
export function stopOfError(error: unknown): PollStop | null {
  if (!(error instanceof ApiError)) return 'gaveUp';
  if (error.status in STOP_BY_STATUS) return STOP_BY_STATUS[error.status]!;
  return isRetryableStatus(error.status) ? null : 'gaveUp';
}

/** Backoff for the n-th retry (1 based): 2 s, 4 s, 8 s and so on. */
export const retryDelayMs = (retry: number) => IMPORT_POLL_MS * 2 ** (retry - 1);

/** Backend `LANGUAGE_PAIR`: the Polygon language name is lowercase letters, the site language `en` or `vi`. */
const PAIR = /^[a-z]+=(en|vi)$/;
export function parseLanguageMap(text: string) {
  const entries = text
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    pairs: entries.filter((entry) => PAIR.test(entry)),
    invalid: entries.filter((entry) => !PAIR.test(entry)),
  };
}
