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
      calls.push(call);
      const handler = routes[`${call.method} ${call.path}`];
      if (!handler) {
        unmatched.push(`${call.method} ${url.pathname}${url.search}`);
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'unmocked', message: 'unmocked' } }), {
            status: 501,
          }),
        );
      }
      const {
        status = 200,
        body,
        headers,
      } = typeof handler === 'function' ? handler(call) : handler;
      return Promise.resolve(
        new Response(body === undefined ? null : JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json', ...headers },
        }),
      );
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
export const noContent = (): MockResponse => ({ status: 204 });

/** A 429 `rate_limited` carrying `Retry-After` (whole seconds), as the backend's rate limiter sends it. */
export const rateLimited = (seconds: number): MockResponse => ({
  ...fail(429, 'rate_limited'),
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
