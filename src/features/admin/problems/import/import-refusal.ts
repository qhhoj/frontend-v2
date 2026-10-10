import type { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { failureTextOf } from '../../ui/admin-errors';

/** A 429 says the hourly limit (shared by the zip import, the Polygon import and sync) and, with `Retry-After`, the wait. */
export function importRefusalText(error: ApiError): string {
  if (error.code !== 'rate_limited') return failureTextOf(error);
  const wait =
    error.retryAfterSeconds === null
      ? ''
      : ` ${translate('admin.ui.retryIn', { seconds: error.retryAfterSeconds })}`;
  return `${translate('admin.polygon.rateLimited')}${wait}`;
}
