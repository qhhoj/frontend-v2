import { ApiError } from './client';
import { MAX_WAIT_MS, parseRetryAfter } from './pdf';
import { apiSend, apiUrl } from './typed';
import type { PackageStatus } from './types/problem-lifecycle';

export type PackageFailure =
  'package_too_large' | 'package_unavailable' | 'package_not_built' | 'rate_limited' | 'generic';
export type PackageProbe =
  | { state: 'ready' }
  | { state: 'building'; retryAfterMs: number }
  | { state: 'failed'; reason: PackageFailure; retryAfterMs: number };

const KNOWN_FAILURES: PackageFailure[] = [
  'package_too_large',
  'package_unavailable',
  'package_not_built',
  'rate_limited',
];

/** The rate-limited call (3 an hour per problem): send it once per click, never to poll. */
export const requestPackage = (code: string): Promise<PackageStatus> =>
  apiSend('post', '/problems/{code}/package', { path: { code } });

export const packageDownloadUrl = (code: string): string =>
  apiUrl('/problems/{code}/package', { path: { code } });

async function fetchProbe(code: string, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(packageDownloadUrl(code), {
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    throw new ApiError('network_error', 0, 'Network error');
  }
}

async function failureOf(response: Response): Promise<PackageProbe> {
  const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
  const code = body?.error?.code;
  const reason = KNOWN_FAILURES.find((known) => known === code) ?? 'generic';
  return {
    state: 'failed',
    reason,
    retryAfterMs: parseRetryAfter(response.headers.get('Retry-After'), MAX_WAIT_MS),
  };
}

/**
 * Asks the download address itself, like `probePdf`: 200 with a zip is ready (the body is cancelled, never read), 202 is
 * still building (ask again after `Retry-After`), anything else is a failure named by the error code.
 */
export async function probePackage(code: string, signal?: AbortSignal): Promise<PackageProbe> {
  const response = await fetchProbe(code, signal);
  if (response.status === 200) {
    void response.body?.cancel();
    if (response.headers.get('Content-Type')?.startsWith('application/zip'))
      return { state: 'ready' };
    throw new ApiError('generic', 200, 'Not a zip');
  }
  if (response.status === 202) {
    void response.body?.cancel();
    return {
      state: 'building',
      retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
    };
  }
  return failureOf(response);
}
