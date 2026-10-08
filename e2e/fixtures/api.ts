import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  contestDetail,
  contestItem,
  leaderboardEntry,
  problemItem,
  problemDetail,
  problemEditorial,
  problemMeta,
  profile,
  ranking,
  ratingHistory,
  sessionResponse,
  submissionDetail,
  submissionItem,
  TYPE_DP_ID,
  userPage,
} from '../../src/test/fixtures';

interface Reply {
  status?: number;
  body?: unknown;
}
type Handler = Reply | ((request: { url: URL; body: unknown }) => Reply);

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
    'GET /problems/duongdi': ok(problemDetail()),
    'GET /problems/duongdi/editorial': ok(problemEditorial()),
    'GET /contests': list([contestItem()]),
    'GET /contests/r42': ok(contestDetail()),
    'GET /contests/r42/ranking': ok(ranking()),
    'GET /users': list([
      leaderboardEntry(1, 'user_07', 2788),
      leaderboardEntry(2, 'user_12', 2431),
    ]),
    'GET /users/user_01': ok(userPage()),
    'GET /users/user_01/ratings': ok(ratingHistory()),
    'GET /submissions': list([submissionItem()]),
    'GET /submissions/sub-1': ok(submissionDetail()),
    'GET /submissions/sub-1/source': ok({ id: 'sub-1', source: 'int main() {}\n' }),
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

  async install(page: Page) {
    await page.route('**/api/internal/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const key = `${request.method()} ${url.pathname.replace('/api/internal', '')}`;
      const handler = this.routes[key];
      if (!handler) {
        this.unmatched.push(`${key}${url.search}`);
        return route.fulfill({ status: 501, json: { error: { code: 'unmocked', message: key } } });
      }
      await this.gates.get(key);
      const reply =
        typeof handler === 'function'
          ? handler({ url, body: request.postDataJSON() as unknown })
          : handler;
      await route.fulfill({
        status: reply.status ?? 200,
        contentType: 'application/json',
        body: reply.body === undefined ? '' : JSON.stringify(reply.body),
      });
    });
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
