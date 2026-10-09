import { trustedUntilBackendFixed } from './backend-ask';
import { apiGet } from './typed';
import type { CallOptions } from './typed';

/** `path` without the leading slash (`about/rules`). The document declares no `path` parameter for the wildcard (ask M5-02). */
export const fetchFlatpage = (path: string) =>
  apiGet(
    '/pages/{path}',
    trustedUntilBackendFixed<CallOptions<'/pages/{path}', 'get'>>('M5-02', { path: { path } }),
  );
