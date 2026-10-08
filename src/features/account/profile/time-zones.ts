const ZERO_OFFSET_NAMES: ReadonlySet<string> = new Set(['GMT', 'GMT+0']);

/** `UTC+7`, `UTC+5:30`, `UTC-4`, `UTC` for `zone` at `at` (daylight saving moves it). Throws RangeError for an unknown zone. */
export function utcOffsetLabel(zone: string, at: Date): string {
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value;
  // ICU writes zero offsets as `GMT` or `GMT+0`; the label says `UTC` either way.
  if (offset === undefined || ZERO_OFFSET_NAMES.has(offset)) return 'UTC';
  return offset.replace('GMT', 'UTC');
}

function optionLabel(zone: string, at: Date): string {
  try {
    return `${zone} (${utcOffsetLabel(zone, at)})`;
  } catch {
    return zone; // a stored name this browser cannot resolve
  }
}

/**
 * Every zone the browser lists, plus the stored one first when the browser does not list it (a legacy alias).
 * Node 22 lists `Asia/Saigon`, not `Asia/Ho_Chi_Minh`, so the default Vietnamese zone takes the first branch.
 */
export function timeZoneOptions(current: string, at: Date): { value: string; label: string }[] {
  const listed = Intl.supportedValuesOf('timeZone');
  const zones = listed.includes(current) ? listed : [current, ...listed];
  return zones.map((zone) => ({ value: zone, label: optionLabel(zone, at) }));
}
