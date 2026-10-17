import { vi } from 'vitest';
import type { FieldIssue } from '@/api/client';

export interface MockResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}
export interface ApiCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Headers;
}
export type MockHandler = MockResponse | ((call: ApiCall) => MockResponse);

/**
 * The shell's own reads on every signed-in page (bell, high-priority banner, official mode, ticket alerts, admin badges). A test that does
 * not route them gets these answers, and the calls are not recorded, so `calls` stays the page's own; route one to test it.
 */
export const SHELL_DEFAULTS: Readonly<Record<string, MockResponse>> = {
  'GET /site': {
    body: { data: { config: {}, officialMode: false, officialModeEndsAt: null } },
  },
  'GET /notifications/unread-count': { body: { data: { count: 0 } } },
  'GET /notifications': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
  'GET /tickets/summary': { body: { data: { assignedOpen: 0, awaitingStaff: 0 } } },
  // The contest bar asks every signed-in page whether the viewer is in a contest.
  'GET /contests/current': { body: { data: null } },
  // The admin nav's count badges (a staff member holding the screen's permission).
  'GET /comments/reports': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
  'GET /admin/organization-requests': {
    body: { data: [], meta: { page: 1, pageSize: 50, total: 0 } },
  },
};

const responseOf = ({ status = 200, body, headers }: MockResponse) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

let unmatched: string[] = [];
/** Requests no route answered since the last call; `setup.ts` fails the test when any exist. */
export const takeUnmatchedRequests = () => {
  const taken = unmatched;
  unmatched = [];
  return taken;
};

/** Stubs `fetch` with routes keyed `"<METHOD> <path>"`, path without `/api/internal` and query. Returns the calls in order. */
export function mockApi(routes: Record<string, MockHandler>): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init: RequestInit = {}) => {
      const url = new URL(input, 'http://localhost');
      const call: ApiCall = {
        method: init.method ?? 'GET',
        path: url.pathname.replace(/^\/api\/internal/, ''),
        query: url.searchParams,
        body:
          init.body instanceof FormData
            ? init.body
            : typeof init.body === 'string'
              ? JSON.parse(init.body)
              : undefined,
        headers: new Headers(init.headers),
      };
      const key = `${call.method} ${call.path}`;
      const shellDefault = routes[key] ? undefined : SHELL_DEFAULTS[key];
      if (shellDefault) return Promise.resolve(responseOf(shellDefault));
      calls.push(call);
      const handler = routes[key];
      if (!handler) {
        unmatched.push(`${call.method} ${url.pathname}${url.search}`);
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'unmocked', message: 'unmocked' } }), {
            status: 501,
          }),
        );
      }
      return Promise.resolve(responseOf(typeof handler === 'function' ? handler(call) : handler));
    }),
  );
  return calls;
}

/** A handler that answers `responses` in order and keeps repeating the last one. */
export const sequence = (...responses: MockResponse[]): MockHandler => {
  let index = 0;
  return () => responses[Math.min(index++, responses.length - 1)]!;
};

export const ok = (data: unknown): MockResponse => ({ body: { data } });
export const page = (items: unknown[], meta: Record<string, unknown> = {}): MockResponse => ({
  body: { data: items, meta: { page: 1, pageSize: 50, total: items.length, ...meta } },
});
export const fail = (
  status: number,
  code: string,
  fields?: Record<string, string[]>,
  issues?: FieldIssue[],
  extra: Record<string, unknown> = {},
): MockResponse => {
  // Like the backend's AppError: `fields` always arrive with `issues` (code `invalid`) unless given.
  const sent =
    issues ??
    (fields &&
      Object.entries(fields).flatMap(([field, messages]) =>
        messages.map((message) => ({ field, code: 'invalid', message })),
      ));
  return {
    status,
    body: {
      error: {
        code,
        message: code,
        ...(fields && { fields }),
        ...(sent && { issues: sent }),
        ...extra,
      },
    },
  };
};

export const issue = (field: string, code: string, message: string): FieldIssue => ({
  field,
  code,
  message,
});

/** A `validation_failed` shaped like the backend's: `issues`, and `fields` built from their messages. */
export function invalid(...issues: FieldIssue[]): MockResponse {
  const fields: Record<string, string[]> = {};
  for (const { field, message } of issues) (fields[field] ??= []).push(message);
  return fail(400, 'validation_failed', fields, issues);
}
/** A refusal shaped like the backend's `conflictIssue`/`badRequestIssue`: one issue carrying a stable code. */
export const failWithCode = (status: number, field: string, code: string): MockResponse =>
  fail(status, status === 409 ? 'conflict' : 'validation_failed', undefined, [
    issue(field, code, `English message of ${code}`),
  ]);
/** A 403 `quota_exceeded` exactly as the backend's `quotaExceeded()` sends it: `details` plus one issue on the meter's name. */
export const quotaExceeded = (details: {
  meter: 'credits' | 'storage';
  limit: number;
  used: number;
  needed: number;
}): MockResponse =>
  fail(
    403,
    'quota_exceeded',
    undefined,
    [issue(details.meter, 'quota_exceeded', `The organization has no ${details.meter} left`)],
    { details },
  );
export const noContent = (): MockResponse => ({ status: 204 });

/** A 429 `rate_limited` carrying `Retry-After` (whole seconds) and its field-less issue, as the backend's rate limiter sends it. */
export const rateLimited = (seconds: number): MockResponse => ({
  ...fail(429, 'rate_limited', undefined, [
    issue('', 'rate_limited', 'Too many attempts; try again later'),
  ]),
  headers: { 'Retry-After': String(seconds) },
});

/** After `mockApi`: requests whose URL contains none of `allowed` never answer, so a screen stays in its loading state. */
export function hangRequestsExcept(allowed: string[]) {
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    allowed.some((fragment) => String(input).includes(fragment))
      ? answer(input, init)
      : new Promise<Response>(() => {}),
  );
}

/** After `mockApi`: requests whose URL contains `fragment` never answer; every other request is answered as routed. */
export function holdRequestsTo(fragment: string) {
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    String(input).includes(fragment) ? new Promise<Response>(() => {}) : answer(input, init),
  );
}
