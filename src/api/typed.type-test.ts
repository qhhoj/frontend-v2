import { expectTypeOf } from 'vitest';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { PagedPath, PlainGetPath } from './typed';

export function rejectedCalls(): void {
  // @ts-expect-error the route does not exist
  void apiGet('/nope');
  // @ts-expect-error a path parameter is required
  void apiGet('/problems/{code}');
  // @ts-expect-error the body must match the document
  void apiSend('post', '/auth/login', { body: { username: 1 } });
  // @ts-expect-error a GET-only route cannot be written to
  void apiSend('post', '/auth/me');
  // @ts-expect-error a query key the document does not list
  void apiGet('/auth/username-available', { query: { username: 'x', nope: 1 } });
  // @ts-expect-error a multipart route takes FormData, not a plain object
  void apiSend('post', '/problems/{code}/submit/file', { path: { code: 'p' }, body: {} });
  // @ts-expect-error a paginated route would drop its meta through apiGet: use apiGetPage
  void apiGet('/problems');
  // @ts-expect-error a plain route has no page to get
  void apiGetPage('/auth/me');
}

export function routeKinds(): void {
  expectTypeOf<'/problems'>().toExtend<PagedPath>();
  expectTypeOf<'/auth/me'>().toExtend<PlainGetPath>();
  expectTypeOf<'/problems'>().not.toExtend<PlainGetPath>();
  expectTypeOf<'/auth/me'>().not.toExtend<PagedPath>();
}
