import type { LocationQuery } from 'vue-router';

export const ACTIVITY_DAY_CHOICES = [7, 30, 90] as const;
export type ActivityDays = (typeof ACTIVITY_DAY_CHOICES)[number];

/** Rows per page of the log and of the live list (the backend's page size). */
export const ACTIVITY_PAGE_SIZE = 50;

export interface ActivityFilter {
  user: string;
  ip: string;
  path: string;
  days: ActivityDays;
}

const DEFAULT_DAYS: ActivityDays = 7;

const textOf = (value: LocationQuery[string] | undefined) =>
  typeof value === 'string' ? value.trim() : '';
const daysOf = (value: string): ActivityDays =>
  (ACTIVITY_DAY_CHOICES as readonly number[]).includes(Number(value))
    ? (Number(value) as ActivityDays)
    : DEFAULT_DAYS;

export const activityFilterFromQuery = (query: LocationQuery): ActivityFilter => ({
  user: textOf(query.user),
  ip: textOf(query.ip),
  path: textOf(query.path),
  days: daysOf(textOf(query.days)),
});

/** The text fields that are filled, in their fixed order (user, ip, path). */
const filledText = (filter: ActivityFilter): Record<string, string> =>
  Object.fromEntries(
    (['user', 'ip', 'path'] as const)
      .filter((field) => filter[field] !== '')
      .map((field) => [field, filter[field]]),
  );

/** Any text field is set: an empty log is then the filter's doing. */
export const isFilteredActivity = (filter: ActivityFilter) =>
  Object.keys(filledText(filter)).length > 0;

/** The request for the API: empty text fields are left out; the key order is user, ip, path, days. */
export const toActivityRequest = (filter: ActivityFilter) => ({
  ...filledText(filter),
  days: filter.days,
});

/** The URL of a filter: a default window (7 days) and empty fields are left out. */
export const activityFilterQuery = (filter: ActivityFilter): Record<string, string> => ({
  ...filledText(filter),
  ...(filter.days === DEFAULT_DAYS ? {} : { days: String(filter.days) }),
});

/** Bars for a daily chart, scaled to the busiest day; a non-zero day is at least 1 px tall so it stays visible. */
export function dailyBars(daily: { day: string; count: number }[], width: number, height: number) {
  const busiest = Math.max(1, ...daily.map((entry) => entry.count));
  const step = daily.length > 0 ? width / daily.length : 0;
  return daily.map((entry, index) => ({
    x: index * step,
    height: entry.count === 0 ? 0 : Math.max(1, Math.round((entry.count / busiest) * height)),
    label: `${entry.day}: ${entry.count}`,
  }));
}

/** Groups of an IPv6 address kept for display; the first four are the network prefix, the part that tells visitors apart. */
const IPV6_SHOWN_GROUPS = 4;

/** An IPv6 address cut to its first four groups plus `…` (`2405:4802:6efc:f980:…`); IPv4 and short IPv6 are left whole. */
export function shortIp(ip: string): string {
  if (!ip.includes(':')) return ip;
  const groups = ip.split(':');
  return groups.length <= IPV6_SHOWN_GROUPS + 1
    ? ip
    : `${groups.slice(0, IPV6_SHOWN_GROUPS).join(':')}:…`;
}

/**
 * The ids of the rows that open a new calendar day among `rows` (in list order), so the table prints the date only there
 * and the bare time elsewhere. `dayOf` names the day of a row's instant in the viewer's zone.
 */
export function dayStartIds(
  rows: readonly { id: string; at: string }[],
  dayOf: (at: string) => string,
): Set<string> {
  const starts = new Set<string>();
  let previous: string | undefined;
  for (const row of rows) {
    const day = dayOf(row.at);
    if (day !== previous) starts.add(row.id);
    previous = day;
  }
  return starts;
}
