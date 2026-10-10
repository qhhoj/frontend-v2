import type { PolygonLinkState } from '@/api/types/polygon';

/** The panel's headline: a failed last sync first, then whether Polygon has a newer READY package. */
export type LinkStatus = 'syncFailed' | 'newer' | 'upToDate' | 'notReady' | 'unknown';

export function linkStatusOf({ link, latestPackage }: PolygonLinkState): LinkStatus {
  if (link.lastSyncResult === 'failed') return 'syncFailed';
  if (!latestPackage) return 'unknown';
  if (latestPackage.state !== 'READY') return 'notReady';
  return (latestPackage.revision ?? 0) > link.revision ? 'newer' : 'upToDate';
}

/** "Đồng bộ ngay" needs a READY newest package; the server refuses any other (409 `polygon_package_not_ready`). */
export const canSyncNow = ({ latestPackage }: PolygonLinkState) => latestPackage?.state === 'READY';
