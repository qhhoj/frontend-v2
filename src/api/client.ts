export const API_BASE = '/api/internal';

/** `total` is sent by /problems, /contests, /submissions and /users; only pp-breakdown sends `hasMore` instead. */
export interface PageMeta {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
}
export interface Page<Item> {
  items: Item[];
  meta: PageMeta;
}

/** A failed request: the backend's `{ error: { code, message, fields } }`, or `network_error` / `invalid_response`. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type QueryValue =
  string | number | boolean | null | undefined | readonly (string | number)[];
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}
interface Envelope {
  data?: unknown;
  meta?: PageMeta;
}

let csrfToken: string | null = null;
/** Set from `/auth/me` and login; memory only, never stored. */
export const setCsrfToken = (token: string | null) => void (csrfToken = token);

let refreshCsrf: (() => Promise<void>) | null = null;
/** The session store installs this: it reloads `/auth/me` so a retried request carries a fresh token. */
export const onCsrfFailed = (handler: (() => Promise<void>) | null) => void (refreshCsrf = handler);

let refreshing: Promise<void> | null = null;
/** Parallel `csrf_failed` answers share one refresh; a failing refresh is ignored so the request's own error surfaces. */
const refreshOnce = (): Promise<void> => {
  refreshing ??= (refreshCsrf?.() ?? Promise.resolve())
    .catch(() => undefined)
    .finally(() => void (refreshing = null));
  return refreshing;
};

let handleUnauthorized: (() => void) | null = null;
/** The session store installs this: a protected request answered `unauthorized` means the session expired. */
export const onUnauthorized = (handler: (() => void) | null) => void (handleUnauthorized = handler);

/** Repeated keys for arrays (`typeIds=a&typeIds=b`, never `typeIds[]`); null, undefined and '' are left out. */
export function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item));
  }
  const search = params.toString();
  return `${API_BASE}${path}${search ? `?${search}` : ''}`;
}

async function send(
  path: string,
  { method = 'GET', query, body, signal }: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    throw new ApiError('network_error', 0, 'Network error');
  }
}

async function errorOf(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; fields?: Record<string, string[]> };
  } | null;
  const error = body?.error;
  return new ApiError(
    error?.code ?? 'http_error',
    response.status,
    error?.message ?? response.statusText,
    error?.fields,
  );
}

async function request(
  path: string,
  options: RequestOptions,
  retried = false,
): Promise<Envelope | undefined> {
  const response = await send(path, options);
  if (response.ok) {
    if (response.status === 204) return undefined;
    return (await response.json().catch(() => {
      throw new ApiError('invalid_response', response.status, 'Unreadable response');
    })) as Envelope;
  }
  const error = await errorOf(response);
  if (error.code === 'csrf_failed' && refreshCsrf && !retried) {
    await refreshOnce();
    return request(path, options, true);
  }
  if (error.code === 'unauthorized' && path !== '/auth/me') handleUnauthorized?.();
  throw error;
}

/** A single value (`{ data }`), or undefined for 204. */
export const apiRequest = async <Result>(
  path: string,
  options: RequestOptions = {},
): Promise<Result> => (await request(path, options))?.data as Result;

/** A list (`{ data, meta }`). */
export async function apiPage<Item>(
  path: string,
  options: RequestOptions = {},
): Promise<Page<Item>> {
  const envelope = await request(path, options);
  if (!envelope?.meta) throw new ApiError('invalid_response', 200, 'Missing page metadata');
  return { items: (envelope.data ?? []) as Item[], meta: envelope.meta };
}
