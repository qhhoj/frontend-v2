import type { Schemas } from './schemas';

export const API_BASE = '/api/internal';

/** A numbered list with a `total` (problems, contests, submissions, users, ...): the default `Page` meta. */
export type TotalPageMeta = Schemas['PageMetaResponse'];
/** Numbered lists: `total` (problems, contests, submissions, users) or `hasMore` instead (pp-breakdown, the admin activity logs). */
export type NumberedPageMeta = TotalPageMeta | Schemas['HasMorePageMetaResponse'];
/** Every `meta` the backend sends; the keyset list of a user's comments has a cursor instead of a page number. */
export type PageMeta = TotalPageMeta | Schemas['CursorPageMetaResponse'];
export interface Page<Item, Meta = TotalPageMeta> {
  items: Item[];
  meta: Meta;
}

/** One failed validation, the machine-readable twin of a `fields` message (the backend's `FieldIssueResponse`). */
export type FieldIssue = Schemas['FieldIssueResponse'];

/**
 * A failed request: the backend's `{ error: { code, message, fields?, issues?, ...extra } }`, or `network_error` / `invalid_response`.
 * `extra` holds the members `AppError` merges next to `code` and `message` (`banReason` of a banned login).
 */
export interface ApiErrorDetails {
  fields?: Record<string, string[]>;
  issues?: FieldIssue[];
  extra?: Record<string, unknown>;
  /** `Retry-After` in whole seconds when the backend sent one (a 429 names the wait). */
  retryAfterSeconds?: number | null;
}

export class ApiError extends Error {
  readonly fields: Record<string, string[]>;
  readonly issues: FieldIssue[];
  readonly extra: Record<string, unknown>;
  readonly retryAfterSeconds: number | null;

  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    details: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.fields = details.fields ?? {};
    this.issues = details.issues ?? [];
    this.extra = details.extra ?? {};
    this.retryAfterSeconds = details.retryAfterSeconds ?? null;
  }
}

export type QueryValue =
  string | number | boolean | null | undefined | readonly (string | number)[];
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** fetch's cache mode; admin reads of public, briefly cached endpoints pass 'no-cache'. */
  cache?: RequestCache;
}
interface Envelope {
  data?: unknown;
  meta?: PageMeta;
}

let csrfToken: string | null = null;
/** Set from `/auth/me` and login; memory only, never stored. */
export const setCsrfToken = (token: string | null) => void (csrfToken = token);

let refreshCsrf: (() => Promise<boolean>) | null = null;
/**
 * The session store installs this: it reloads `/auth/me` so a retried request carries a fresh token, and resolves true only when the
 * session still belongs to the account that sent the request (another tab may have signed in as someone else).
 */
export const onCsrfFailed = (handler: (() => Promise<boolean>) | null) =>
  void (refreshCsrf = handler);

let refreshing: Promise<boolean> | null = null;
/** Parallel `csrf_failed` answers share one refresh; a failing refresh allows no retry, so the request's own error surfaces. */
const refreshOnce = (): Promise<boolean> => {
  refreshing ??= (refreshCsrf?.() ?? Promise.resolve(false))
    .catch(() => false)
    .finally(() => void (refreshing = null));
  return refreshing;
};

let handleUnauthorized: (() => void) | null = null;
/** The session store installs this: a protected request answered `unauthorized` means the session expired. */
export const onUnauthorized = (handler: (() => void) | null) => void (handleUnauthorized = handler);

let handleGate: (() => void) | null = null;
/** The router installs this: a request answered `two_factor_required` or `password_change_required` means the session needs a step this page did not know about. */
export const onGateRequired = (handler: (() => void) | null) => void (handleGate = handler);
const GATE_CODES = ['two_factor_required', 'password_change_required'];

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
  { method = 'GET', query, body, signal, cache }: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
      cache,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    throw new ApiError('network_error', 0, 'Network error');
  }
}

function retryAfterSecondsOf(response: Response): number | null {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isInteger(seconds) && seconds > 0 ? seconds : null;
}

async function errorOf(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    error?: {
      code?: string;
      message?: string;
      fields?: Record<string, string[]>;
      issues?: FieldIssue[];
    } & Record<string, unknown>;
  } | null;
  const { code, message, fields, issues, ...extra } = body?.error ?? {};
  return new ApiError(
    code ?? 'http_error',
    response.status,
    message ?? response.statusText,
    // A `null` (or otherwise malformed) member is as good as absent.
    {
      fields: fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : undefined,
      issues: Array.isArray(issues) ? issues : undefined,
      extra,
      retryAfterSeconds: retryAfterSecondsOf(response),
    },
  );
}

/** An expired session (`unauthorized`, except on `/auth/me` itself) and a gate both mean the session needs another look. */
function notifySessionHooks(error: ApiError, path: string) {
  if (error.code === 'unauthorized' && path !== '/auth/me') handleUnauthorized?.();
  if (GATE_CODES.includes(error.code)) handleGate?.();
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
  if (error.code === 'csrf_failed' && refreshCsrf && !retried && (await refreshOnce()))
    return request(path, options, true);
  notifySessionHooks(error, path);
  throw error;
}

/** A raw text body (no `{ data }` envelope), with the same error and session handling as `apiRequest`. */
export async function apiText(path: string): Promise<string> {
  const response = await send(path, {});
  if (!response.ok) {
    const error = await errorOf(response);
    notifySessionHooks(error, path);
    throw error;
  }
  return response.text();
}

/** A single value (`{ data }`), or undefined for 204. */
export const apiRequest = async <Result>(
  path: string,
  options: RequestOptions = {},
): Promise<Result> => (await request(path, options))?.data as Result;

/** A list (`{ data, meta }`). */
export async function apiPage<Item, Meta = TotalPageMeta>(
  path: string,
  options: RequestOptions = {},
): Promise<Page<Item, Meta>> {
  const envelope = await request(path, options);
  if (!envelope?.meta) throw new ApiError('invalid_response', 200, 'Missing page metadata');
  return { items: (envelope.data ?? []) as Item[], meta: envelope.meta as Meta };
}
