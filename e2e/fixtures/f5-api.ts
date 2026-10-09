import { createdIntegrationClient, integrationClient, shortLink } from '../../src/test/f5-fixtures';
import { list } from './reply';
import type { Handler } from './reply';

/** Codes from the backend alphabet, handed out in order; the same path keeps its code (automatic links are idempotent). */
const CODES = ['k7m2xq', 'p4tw9d', 'h3zn8c', 'r6dt2g', 'w9bf4u'];

/** Short-link and integration-client routes. Tests replace single routes as they need. */
export const f5Routes = (): Record<string, Handler> => {
  const codes = new Map<string, string>();
  return {
    'POST /short-links': ({ body }) => {
      const { path } = body as { path: string };
      const code = codes.get(path) ?? CODES[codes.size % CODES.length];
      codes.set(path, code);
      return { status: 201, body: { data: shortLink({ code, path }) } };
    },
    'GET /short-links': list([
      shortLink(),
      shortLink({
        code: 'hsg-2026',
        path: '/contests/hsg26',
        isAuto: false,
        hits: 42,
        lastHitAt: '2026-10-09T07:00:00.000Z',
        expiresAt: '2026-12-31T00:00:00.000Z',
      }),
    ]),
    'DELETE /short-links/:code': { status: 204 },
    'GET /integration-clients': list([integrationClient()]),
    'POST /integration-clients': { status: 201, body: { data: createdIntegrationClient() } },
    'DELETE /integration-clients/:id': { status: 204 },
  };
};
