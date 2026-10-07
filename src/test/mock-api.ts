import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
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
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
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
      const { status = 200, body } = typeof handler === 'function' ? handler(call) : handler;
      return Promise.resolve(
        new Response(body === undefined ? null : JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }),
  );
  return calls;
}

export const ok = (data: unknown): MockResponse => ({ body: { data } });
export const page = (items: unknown[], meta: Record<string, unknown> = {}): MockResponse => ({
  body: { data: items, meta: { page: 1, pageSize: 50, total: items.length, ...meta } },
});
export const fail = (
  status: number,
  code: string,
  fields?: Record<string, string[]>,
): MockResponse => ({
  status,
  body: { error: { code, message: code, ...(fields && { fields }) } },
});
export const noContent = (): MockResponse => ({ status: 204 });
