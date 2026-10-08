import { apiRequest } from './client';
import type { Flatpage } from './types/flatpages';

/** `path` without the leading slash (`about/rules`); each segment is encoded, the slashes stay. */
export const fetchFlatpage = (path: string) =>
  apiRequest<Flatpage>(
    `/pages/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`,
  );
