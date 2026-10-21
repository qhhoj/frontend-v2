import type { PolygonLinkState } from '@/api/types/polygon';

/** Whether Polygon has a newer READY package than the one in use. */
export type PackageStatus = 'newer' | 'upToDate' | 'notReady' | 'unknown';

function packageStatusOf({ link, latestPackage }: PolygonLinkState): PackageStatus {
  if (!latestPackage) return 'unknown';
  if (latestPackage.state !== 'READY') return 'notReady';
  return (latestPackage.revision ?? 0) > link.revision ? 'newer' : 'upToDate';
}

/** "Đồng bộ ngay" needs a READY newest package; the server refuses any other (409 `polygon_package_not_ready`). */
export const canSyncNow = ({ latestPackage }: PolygonLinkState) => latestPackage?.state === 'READY';

/**
 * The panel's status banner (option C), first match: a sync running (none can start meanwhile), options saved since
 * the last sync (sync to apply them), a failed last sync (`attention` when it imported but a file step failed), then the
 * package status.
 */
export type BannerKind = 'running' | 'saved' | 'failed' | 'attention' | PackageStatus;

export function bannerKindOf(
  state: PolygonLinkState,
  { isRunning, isSaved }: { isRunning: boolean; isSaved: boolean },
): BannerKind {
  if (isRunning) return 'running';
  if (isSaved) return 'saved';
  if (state.link.lastSyncResult === 'failed')
    return state.link.lastSyncErrorCode === 'imported_needs_attention' ? 'attention' : 'failed';
  return packageStatusOf(state);
}

const SYNC_KINDS: ReadonlySet<BannerKind> = new Set(['saved', 'failed', 'attention', 'newer']);

/** The banner's one action: the options when they caused the failure, else a sync while one can run, else none. */
export function bannerActionOf(
  kind: BannerKind,
  state: PolygonLinkState,
  isOptionsFailure: boolean,
): 'sync' | 'editOptions' | null {
  if (kind === 'failed' && isOptionsFailure) return 'editOptions';
  return SYNC_KINDS.has(kind) && canSyncNow(state) ? 'sync' : null;
}
