import type { RuntimeJudge, RuntimeLanguage } from '@/api/types/runtimes';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** The version most judges have; ties go to the one seen first. Null when no judge has the language. */
export function commonVersion(language: RuntimeLanguage): string | null {
  const counts = new Map<string, number>();
  for (const { version } of language.versions) counts.set(version, (counts.get(version) ?? 0) + 1);
  let best: string | null = null;
  for (const [version, count] of counts)
    if (best === null || count > (counts.get(best) ?? 0)) best = version;
  return best;
}

/** Names of the online judges whose version differs from the common one (an offline judge is asleep, not wrong). */
export function mismatchedJudges(language: RuntimeLanguage, judges: RuntimeJudge[]): string[] {
  const common = commonVersion(language);
  const online = new Set(judges.filter((judge) => judge.online).map((judge) => judge.name));
  return language.versions
    .filter((entry) => online.has(entry.judge) && entry.version !== common)
    .map((entry) => entry.judge);
}

export interface RuntimeTotals {
  online: number;
  total: number;
  busy: number;
  slots: number;
  /** Mean ping in ms over the online judges that report one; null when none does. */
  pingMs: number | null;
}

export function runtimeTotals(judges: RuntimeJudge[]): RuntimeTotals {
  const online = judges.filter((judge) => judge.online);
  const pings = online.flatMap((judge) => (judge.pingMs === null ? [] : [judge.pingMs]));
  return {
    online: online.length,
    total: judges.length,
    busy: online.reduce((sum, judge) => sum + judge.busy, 0),
    slots: online.reduce((sum, judge) => sum + judge.slots, 0),
    pingMs: pings.length
      ? Math.round(pings.reduce((sum, ping) => sum + ping, 0) / pings.length)
      : null,
  };
}

export interface Uptime {
  unit: 'day' | 'hour' | 'minute';
  count: number;
}

/** The largest whole unit since `startedAt`: "12 days", "3 hours", "5 minutes" (a minute at least). */
export function uptimeSince(startedAt: string, now: number): Uptime {
  const minutes = Math.max(
    1,
    Math.floor((now - Date.parse(startedAt)) / (SECONDS_PER_MINUTE * 1000)),
  );
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours >= HOURS_PER_DAY) return { unit: 'day', count: Math.floor(hours / HOURS_PER_DAY) };
  return hours >= 1 ? { unit: 'hour', count: hours } : { unit: 'minute', count: minutes };
}
