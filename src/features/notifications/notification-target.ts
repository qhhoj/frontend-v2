import { ApiError } from '@/api/client';
import { fetchContest } from '@/api/contests.api';
import { fetchOrganization } from '@/api/organizations.api';
import { fetchTicket } from '@/api/tickets.api';

type Probe = (key: string) => Promise<unknown>;
/** The first path segment names the read that tells whether the viewer can still open the target. */
const PROBES: Readonly<Record<string, Probe>> = {
  tickets: fetchTicket,
  contests: fetchContest,
  organizations: fetchOrganization,
};

const decodedSegment = (segment: string | undefined): string | null => {
  if (segment === undefined) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

/** The read for a notification's internal path, or null when the path names no probed target. */
export function probeOf(path: string): (() => Promise<unknown>) | null {
  const [area, segment] = path.split(/[?#]/, 1)[0]!.split('/').filter(Boolean);
  const key = decodedSegment(segment);
  if (area === undefined || key === null || !Object.hasOwn(PROBES, area)) return null;
  const probe = PROBES[area]!;
  return () => probe(key);
}

/** 403 and 404: the viewer can no longer open the target, so the row reads "Thông báo cũ". */
export const isGoneError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 403 || error.status === 404);

/** Any other failure counts as open: the target page shows its own error. */
export async function isTargetGone(path: string): Promise<boolean> {
  const probe = probeOf(path);
  if (!probe) return false;
  return probe().then(() => false, isGoneError);
}
