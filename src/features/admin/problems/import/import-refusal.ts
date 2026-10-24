import type { ApiError } from '@/api/client';
import { readRefusal } from '../../ui/admin-errors';
import { IMPORT_REFUSALS } from '../../ui/refusal-catalog';

/** A 429 says the hourly limit (shared by the zip import, the Polygon import and sync) and, with `Retry-After`, the wait. */
export const importRefusalText = (error: ApiError): string =>
  readRefusal(error, { catalog: IMPORT_REFUSALS }).line ?? '';
