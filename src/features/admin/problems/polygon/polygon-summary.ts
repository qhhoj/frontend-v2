import type { Schemas } from '@/api/schemas';
import { i18n, translate } from '@/i18n';
import { formatMemoryLimit, formatTimeLimit } from '@/lib/format';

const LINK = 'admin.polygonLink.progress';

type Summary = Schemas['ImportSummaryResponse'];
type Limit = Schemas['ClampedLimitResponse'];
type SyncedSetting = Schemas['SyncedSetting'];
export interface SummaryRow {
  key: 'checker' | 'tests' | 'time' | 'memory';
  value: string;
  /** Where QHHOJ differs from the package (a clamped limit, a checker not run); null when it does not. */
  note: string | null;
}

/** A site checker's name as the data tab says it; a name this page does not know as it is. */
function checkerName(checker: Summary['checker']): string {
  if (checker === 'bridged') return translate('admin.problems.data.checkers.bridged');
  const key = `admin.problems.data.config.stock.${checker}.label`;
  return i18n.global.te(key) ? translate(key) : checker;
}

/** A setting a sync kept as edited on QHHOJ, beside what the package has. */
const keptNote = (polygon: string | null) =>
  polygon ? translate(`${LINK}.summary.kept`, { polygon }) : translate(`${LINK}.localEdits.kept`);

/**
 * The checker as stored: kept by a sync, or mapped from the package. An interactive problem's checker runs on what the
 * interactor wrote, unless a sync kept a local grader without one (`checkerIgnored`): then the interactor alone decides.
 */
function checkerRow(summary: Summary, isKept: boolean): SummaryRow {
  if (summary.checkerIgnored) {
    const value = translate(`${LINK}.summary.interactorOnly`);
    return { key: 'checker', value, note: translate(`${LINK}.summary.checkerIgnored`) };
  }
  const name = checkerName(summary.checker);
  const mapped = summary.polygonChecker && !isKept ? `${summary.polygonChecker} → ${name}` : name;
  const value = summary.interactive
    ? translate(`${LINK}.summary.interactive`, { checker: mapped })
    : mapped;
  return { key: 'checker', value, note: isKept ? keptNote(summary.polygonChecker) : null };
}

function testsRow({ tests, cases, batches }: Summary): SummaryRow {
  const parts = [translate(`${LINK}.summary.tests`, { count: tests })];
  if (cases !== tests) parts.push(translate(`${LINK}.summary.cases`, { count: cases }));
  if (batches > 0) parts.push(translate(`${LINK}.summary.batches`, { count: batches }));
  return { key: 'tests', value: parts.join(' · '), note: null };
}

function limitRow(
  key: SummaryRow['key'],
  limit: Limit,
  format: (n: number) => string,
  isKept: boolean,
): SummaryRow {
  if (limit.polygon === limit.applied) return { key, value: format(limit.applied), note: null };
  if (isKept) return { key, value: format(limit.applied), note: keptNote(format(limit.polygon)) };
  const way = limit.applied < limit.polygon ? 'lowered' : 'raised';
  const note = translate(`${LINK}.summary.${way}`, { polygon: format(limit.polygon) });
  return { key, value: format(limit.applied), note };
}

/**
 * "Khác gì so với Polygon": the checker mapping, the tests as judged, and each limit with its clamp; a setting in `kept`
 * (a sync kept it as edited on QHHOJ) says so instead.
 */
export const summaryRowsOf = (
  summary: Summary,
  kept: readonly SyncedSetting[] = [],
): SummaryRow[] => [
  checkerRow(summary, kept.includes('checker')),
  testsRow(summary),
  limitRow('time', summary.timeLimit, formatTimeLimit, kept.includes('timeLimit')),
  limitRow('memory', summary.memoryLimit, formatMemoryLimit, kept.includes('memoryLimit')),
];

/** The order settings are named in, as the data tab draws them. */
const SETTING_ORDER: readonly SyncedSetting[] = [
  'timeLimit',
  'memoryLimit',
  'partial',
  'checker',
  'grader',
];
export interface LocalEditsRow {
  kind: 'kept' | 'updated';
  /** The settings' names, comma-separated. */
  names: string;
}

/** What a sync did with the settings a setter may edit on QHHOJ: kept, then taken from the package; an empty list has no row. */
export function localEditsRowsOf(localEdits: Schemas['LocalEditsResponse']): LocalEditsRow[] {
  const namesOf = (settings: readonly SyncedSetting[]) =>
    SETTING_ORDER.filter((setting) => settings.includes(setting))
      .map((setting) => translate(`${LINK}.localEdits.settings.${setting}`))
      .join(', ');
  const rows: LocalEditsRow[] = [
    { kind: 'kept', names: namesOf(localEdits.kept) },
    { kind: 'updated', names: namesOf(localEdits.updated) },
  ];
  return rows.filter((row) => row.names);
}
