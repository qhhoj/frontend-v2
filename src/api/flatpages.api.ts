import { apiGet } from './typed';

/** `path` without the leading slash (`about/rules`); the typed client sends it as one encoded segment. */
export const fetchFlatpage = (path: string) => apiGet('/pages/{path}', { path: { path } });
