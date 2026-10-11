import type { ContestFormatName } from '@/api/types/contest-editing';

export interface FormatField {
  name: string;
  kind: 'minutes' | 'flag';
  labelKey: string;
}
const field = (name: string, kind: FormatField['kind']): FormatField => ({
  name,
  kind,
  labelKey: `admin.contests.format.fields.${name}`,
});

/** From `libs/contests/src/formats` (2026-10-08). The board's "Hệ số tính thời gian" and CE counting do not exist there. */
export const FORMAT_FIELDS: Record<ContestFormatName, FormatField[]> = {
  default: [],
  ultimate: [],
  icpc: [field('penalty', 'minutes')],
  vnoj: [field('penalty', 'minutes'), field('lso', 'flag')],
  ioi: [field('cumtime', 'flag'), field('lastScoreAltering', 'flag')],
  ioi16: [field('cumtime', 'flag')],
  final_submission: [field('autoJudge', 'flag')],
};

export const FORMAT_DEFAULTS: Record<ContestFormatName, Record<string, number | boolean>> = {
  default: {},
  ultimate: {},
  icpc: { penalty: 20 },
  vnoj: { penalty: 5, lso: false },
  ioi: { cumtime: false, lastScoreAltering: false },
  ioi16: { cumtime: false },
  final_submission: { autoJudge: true },
};

/** The backend refuses unknown keys, so only the format's own keys survive. */
export function configFor(
  formatName: ContestFormatName,
  stored: Record<string, unknown>,
): Record<string, number | boolean> {
  const config = { ...FORMAT_DEFAULTS[formatName] };
  for (const { name } of FORMAT_FIELDS[formatName]) {
    const value = stored[name];
    if (typeof value === 'number' || typeof value === 'boolean') config[name] = value;
  }
  return config;
}

/** Changing the format puts the new format's own defaults in its config (the backend refuses keys it does not know). */
export function chooseFormat(
  form: { formatName: ContestFormatName; formatConfig: Record<string, number | boolean> },
  name: ContestFormatName,
): void {
  form.formatName = name;
  form.formatConfig = { ...FORMAT_DEFAULTS[name] };
}

/** The formats the Basic view offers as cards; the others are picked in the Advanced view. */
export const COMMON_FORMATS = [
  'ioi',
  'icpc',
  'default',
] as const satisfies readonly ContestFormatName[];
