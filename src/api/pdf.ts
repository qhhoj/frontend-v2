import { ApiError } from './client';
import { problemPdfUrl } from './problems.api';
import type { StatementLanguage } from './types/problems';

export type PdfProbe =
  | { state: 'ready' }
  | { state: 'rendering'; retryAfterMs: number }
  | { state: 'unavailable'; reason: 'pdf_unavailable' | 'rate_limited'; retryAfterMs: number };

/** The backend asks clients to poll no faster than every 3 s (CONTRIBUTING, error codes: `pdf_unavailable`). */
export const MIN_POLL_MS = 3000;
export const MAX_POLL_MS = 10_000;
export const MAX_WAIT_MS = 300_000;

/** `Retry-After` in whole seconds; the HTTP-date form is not used by the backend, so it counts as absent. */
export function parseRetryAfter(header: string | null, maxMs = MAX_POLL_MS): number {
  if (header === null || !/^\d{1,5}$/.test(header.trim())) return MIN_POLL_MS;
  return Math.min(maxMs, Math.max(MIN_POLL_MS, Number(header) * 1000));
}

/**
 * Asks the PDF address itself (GET starts the render; HEAD would not): 200 means the file is ready (the body is not read),
 * 202 `{ data: { status: 'rendering' } }` means ask again after `Retry-After`, 503 `pdf_unavailable` and 429 mean stop for `Retry-After`.
 */
export async function probePdf(
  code: string,
  lang: StatementLanguage,
  signal?: AbortSignal,
): Promise<PdfProbe> {
  let response: Response;
  try {
    response = await fetch(problemPdfUrl(code, lang), {
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    throw new ApiError('network_error', 0, 'Network error');
  }
  void response.body?.cancel();
  const retryAfter = response.headers.get('Retry-After');
  if (response.status === 200) {
    // A 200 from an SPA fallback or a proxy page is not the file: only a PDF counts as ready.
    if (response.headers.get('Content-Type')?.startsWith('application/pdf'))
      return { state: 'ready' };
    throw new ApiError('generic', 200, 'Not a PDF');
  }
  if (response.status === 202)
    return { state: 'rendering', retryAfterMs: parseRetryAfter(retryAfter) };
  if (response.status === 503 || response.status === 429)
    return {
      state: 'unavailable',
      reason: response.status === 429 ? 'rate_limited' : 'pdf_unavailable',
      retryAfterMs: parseRetryAfter(retryAfter, MAX_WAIT_MS),
    };
  throw new ApiError(
    response.status === 404 ? 'not_found' : 'generic',
    response.status,
    'PDF unavailable',
  );
}
