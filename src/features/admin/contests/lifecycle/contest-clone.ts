const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** A weekly contest is the common copy: the dialog offers the source's start one week later. */
export const defaultCloneStart = (sourceStart: string): string =>
  new Date(Date.parse(sourceStart) + WEEK_MS).toISOString();

/** The copy keeps the source's length: the end the backend will set for `newStart`, or null while no start reads. */
export function cloneEnd(
  source: { startTime: string; endTime: string },
  newStart: string | null,
): string | null {
  const start = newStart ? Date.parse(newStart) : Number.NaN;
  if (!Number.isFinite(start)) return null;
  const length = Date.parse(source.endTime) - Date.parse(source.startTime);
  return new Date(start + length).toISOString();
}
