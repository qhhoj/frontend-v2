export type ImportPhase = 'queued' | 'running' | 'done' | 'failed';
export const IMPORT_POLL_MS = 2000;

const PHASES: Record<string, ImportPhase> = {
  active: 'running',
  completed: 'done',
  failed: 'failed',
};
/** BullMQ states: waiting, delayed, prioritized, waiting-children (and any new one) all mean "not started yet". */
export const phaseOf = (state: string): ImportPhase => PHASES[state] ?? 'queued';
export const isFinal = (phase: ImportPhase) => phase === 'done' || phase === 'failed';

/** Backend `LANGUAGE_PAIR`: the Polygon language name is lowercase letters, the site language `en` or `vi`. */
const PAIR = /^[a-z]+=(en|vi)$/;
export function parseLanguageMap(text: string) {
  const entries = text
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    pairs: entries.filter((entry) => PAIR.test(entry)),
    invalid: entries.filter((entry) => !PAIR.test(entry)),
  };
}
