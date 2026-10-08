import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  announcement,
  contestDetail,
  contestItem,
  contestProblem,
  contestStats,
  leaderboardEntry,
  problemItem,
  problemDetail,
  problemEditorial,
  participationSummary,
  problemMeta,
  profile,
  ranking,
  ratingHistory,
  sessionResponse,
  submissionDetail,
  submissionItem,
  submissionStats,
  TYPE_DP_ID,
  userPage,
} from '../../src/test/fixtures';

interface Reply {
  status?: number;
  body?: unknown;
  /** Extra response headers (`Retry-After`, `Cache-Control`). */
  headers?: Record<string, string>;
  /** Defaults to application/json; `application/pdf` and `text/event-stream` for the PDF and the feeds. */
  contentType?: string;
  /** Sent as is instead of `JSON.stringify(body)`. */
  raw?: string | Buffer;
}
interface SeenRequest {
  key: string;
  url: URL;
  headers: Record<string, string>;
  /** Raw body: a multipart upload is asserted on its text (language id, file name). */
  postData: Buffer | null;
  replyStatus: number;
  replyContentType: string;
}
interface HandlerInput {
  url: URL;
  body: unknown;
  postData: Buffer | null;
  headers: Record<string, string>;
  params: Record<string, string>;
}
type Handler = Reply | ((request: HandlerInput) => Reply);

/** `GET /problems/:code` style keys: a segment starting with `:` matches any one segment. */
function matchPattern(pattern: string, key: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const keyParts = key.split('/');
  if (patternParts.length !== keyParts.length) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(keyParts[index]);
    else if (part !== keyParts[index]) return null;
  }
  return params;
}

const eventStream = (...frames: string[]): Reply => ({
  contentType: 'text/event-stream',
  // The long retry stops the browser re-requesting a finished stream.
  raw: `retry: 600000\n\n${frames.join('')}`,
});
export const streamFrame = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
export const pdfReady: Reply = {
  contentType: 'application/pdf',
  raw: Buffer.from('%PDF-1.4\n%%EOF'),
};

const ok = (data: unknown): Reply => ({ body: { data } });
export const list = (items: unknown[]): Reply => ({
  body: { data: items, meta: { page: 1, pageSize: 50, total: items.length } },
});
const UNAUTHORIZED: Reply = {
  status: 401,
  body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
};

/** A small stateful stand-in for /api/internal: signed out until POST /auth/login, signed out again after POST /auth/logout. */
export class FakeApi {
  signedIn = false;
  readonly unmatched: string[] = [];
  readonly requests: SeenRequest[] = [];
  private readonly gates = new Map<string, Promise<void>>();
  private readonly releases: Array<() => void> = [];
  readonly routes: Record<string, Handler> = {
    'GET /auth/me': () => (this.signedIn ? ok(sessionResponse()) : UNAUTHORIZED),
    'POST /auth/login': () => {
      this.signedIn = true;
      return ok(sessionResponse());
    },
    'POST /auth/logout': () => {
      this.signedIn = false;
      return { status: 204 };
    },
    'GET /auth/social/providers': ok({ providers: ['google', 'github'] }),
    'GET /profile': ok(profile()),
    'PATCH /profile': ({ body }) => ok(profile(body as object)),
    'GET /problems/meta': ok(problemMeta()),
    'GET /problems': ({ url }) =>
      list(
        url.searchParams.getAll('typeIds').includes(TYPE_DP_ID)
          ? [problemItem()]
          : [
              problemItem(),
              problemItem({
                id: '0192a000-0000-7000-8000-0000000002b1',
                code: 'sp',
                name: 'Đường đi ngắn nhất',
                types: [],
              }),
            ],
      ),
    'GET /problems/:code': ({ params }) => ok(problemDetail({ code: params.code })),
    'GET /problems/:code/editorial': ok(problemEditorial()),
    'POST /problems/:code/submit': ok({ id: 'sub-9' }),
    'POST /problems/:code/submit/file': ok({ id: 'sub-9' }),
    'GET /contests': ({ url }) => {
      const phase = url.searchParams.get('phase');
      return list(
        phase === 'running'
          ? [contestItem()]
          : phase === 'upcoming'
            ? [
                contestItem({
                  key: 'r43',
                  name: 'QHH Round #43',
                  phase: 'upcoming',
                  startTime: '2026-10-11T12:30:00Z',
                  endTime: '2026-10-11T15:00:00Z',
                }),
              ]
            : [
                contestItem({
                  key: 'r41',
                  name: 'QHH Round #41',
                  phase: 'ended',
                  startTime: '2026-10-01T12:30:00Z',
                  endTime: '2026-10-01T15:00:00Z',
                  virtualCount: 318,
                }),
              ],
      );
    },
    'GET /contests/current': ok(null),
    'GET /contests/r42': ok(
      contestDetail({ problems: [contestProblem(0), contestProblem(1), contestProblem(2)] }),
    ),
    'GET /contests/r42/ranking': ok(ranking()),
    'GET /contests/:key/announcements': list([announcement(1)]),
    'GET /contests/:key/stats': ok(contestStats()),
    'GET /contests/:key/submissions': list([submissionItem()]),
    'POST /contests/:key/join': ok(participationSummary()),
    'POST /contests/:key/register': ok(participationSummary({ isRegistered: true })),
    'POST /contests/:key/leave': { status: 204 },
    'GET /events/contests/:key': eventStream(),
    'GET /users': list([
      leaderboardEntry(1, 'user_07', 2788),
      leaderboardEntry(2, 'user_12', 2431),
    ]),
    'GET /users/user_01': ok(userPage()),
    'GET /users/user_01/ratings': ok(ratingHistory()),
    'GET /submissions': list([submissionItem()]),
    'GET /submissions/stats': ok(submissionStats()),
    'GET /submissions/:id': ({ params }) => ok(submissionDetail({ id: params.id })),
    'GET /submissions/:id/source': ({ params }) => ok({ id: params.id, source: 'int main() {}\n' }),
    'GET /events/submissions/:id': eventStream(),
    'GET /events/submissions': eventStream(),
  };

  /** Delays every answer to `key` ("GET /problems") until the returned function is called; teardown releases whatever is left. */
  hold(key: string): () => void {
    let release = () => {};
    this.gates.set(key, new Promise<void>((resolve) => (release = resolve)));
    this.releases.push(release);
    return release;
  }

  releaseAll() {
    this.releases.forEach((release) => release());
  }

  /** An exact key always wins over a `:param` pattern, so `GET /submissions/stats` beats `GET /submissions/:id`. */
  private lookup(key: string) {
    const exact = this.routes[key];
    if (exact) return { handler: exact, params: {} };
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const params = pattern.includes(':') ? matchPattern(pattern, key) : null;
      if (params) return { handler, params };
    }
    return undefined;
  }

  async install(page: Page) {
    await page.route('**/api/internal/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const key = `${request.method()} ${url.pathname.replace('/api/internal', '')}`;
      const found = this.lookup(key);
      if (!found) {
        this.unmatched.push(`${key}${url.search}`);
        return route.fulfill({ status: 501, json: { error: { code: 'unmocked', message: key } } });
      }
      await this.gates.get(key);
      let body: unknown;
      try {
        body = request.postDataJSON();
      } catch {
        body = undefined; // multipart
      }
      const headers = request.headers();
      const postData = request.postDataBuffer();
      const reply =
        typeof found.handler === 'function'
          ? found.handler({ url, body, postData, headers, params: found.params })
          : found.handler;
      const contentType = reply.contentType ?? 'application/json';
      const status = reply.status ?? 200;
      this.requests.push({
        key,
        url,
        headers,
        postData,
        replyStatus: status,
        replyContentType: contentType,
      });
      await route.fulfill({
        status,
        headers: reply.headers,
        contentType,
        body: reply.raw ?? (reply.body === undefined ? '' : JSON.stringify(reply.body)),
      });
    });
  }

  requestsTo(key: string) {
    return this.requests.filter((seen) => seen.key === key);
  }
}

export const test = base.extend<{ api: FakeApi }>({
  api: async ({ page }, use) => {
    const api = new FakeApi();
    await api.install(page);
    await use(api);
    api.releaseAll();
    expect(api.unmatched, 'requests without a FakeApi route').toEqual([]);
  },
});
export { expect };
