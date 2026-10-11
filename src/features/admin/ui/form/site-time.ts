/**
 * Admin dates and times are typed and shown in the site's time zone, not the viewer's, as `dd/mm/yyyy hh:mm`.
 * Values crossing the API are ISO instants in UTC.
 */
export const SITE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const MINUTE_MS = 60_000;
const pad = (value: number) => String(value).padStart(2, '0');

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** The wall clock in `zone` at `instant`. */
function wallTimeIn(zone: string, instant: Date): WallTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
  };
}

const wallTimeAsUtc = (wall: WallTime) =>
  Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);

/** Minutes `zone` is ahead of UTC at `instant` (420 for Asia/Ho_Chi_Minh). */
export function zoneOffsetMinutes(zone: string, instant: Date): number {
  const flooredToMinute = Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return (wallTimeAsUtc(wallTimeIn(zone, instant)) - flooredToMinute) / MINUTE_MS;
}

/** `GMT+7`, `GMT-3:30`, `GMT` for the zone's offset at `instant`. */
export function zoneLabel(zone: string, instant: Date = new Date()): string {
  const offset = zoneOffsetMinutes(zone, instant);
  if (offset === 0) return 'GMT';
  const sign = offset > 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `GMT${sign}${hours}${minutes ? `:${pad(minutes)}` : ''}`;
}

/** An API instant as `dd/mm/yyyy hh:mm` in `zone`; null or an unreadable value is empty. */
export function formatInZone(iso: string | null, zone: string = SITE_TIME_ZONE): string {
  if (!iso) return '';
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return '';
  const wall = wallTimeIn(zone, instant);
  return `${pad(wall.day)}/${pad(wall.month)}/${wall.year} ${pad(wall.hour)}:${pad(wall.minute)}`;
}

/** `d/m/yyyy`, then optionally `h:mm` (a comma or spaces between); `-` and `.` also separate the date. */
const TYPED = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/;

function readWallTime(text: string): WallTime | null {
  const match = TYPED.exec(text);
  if (!match) return null;
  const [day, month, year, hour, minute] = match.slice(1).map((value) => Number(value ?? 0)) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const wall = { year, month, day, hour, minute };
  const probe = new Date(wallTimeAsUtc(wall));
  const isRealDate =
    probe.getUTCFullYear() === wall.year &&
    probe.getUTCMonth() === wall.month - 1 &&
    probe.getUTCDate() === wall.day;
  return isRealDate && hour < 24 && minute < 60 ? wall : null;
}

export type ParsedTime = { ok: true; iso: string | null } | { ok: false };

/**
 * Typed text read as a wall clock in `zone`: empty is null, a malformed or impossible date (31/02) is not ok.
 * The offset is checked twice, so a zone with daylight saving lands on the right side of the change.
 */
export function parseInZone(text: string, zone: string = SITE_TIME_ZONE): ParsedTime {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, iso: null };
  const wall = readWallTime(trimmed);
  if (!wall) return { ok: false };
  const asUtc = wallTimeAsUtc(wall);
  const firstGuess = asUtc - zoneOffsetMinutes(zone, new Date(asUtc)) * MINUTE_MS;
  const instant = asUtc - zoneOffsetMinutes(zone, new Date(firstGuess)) * MINUTE_MS;
  return { ok: true, iso: new Date(instant).toISOString() };
}
