/**
 * The workbench's one save, as parts sent one after another. The order is fixed here, not by the caller: the problem PATCH
 * goes first because a changed code moves the test data and every later part must be sent to the new code; the data
 * configuration goes last. There is no transaction: a part that fails stays unsaved and the parts after it are still tried,
 * except after a failed problem PATCH (the code the later parts need is then unknown, so they are skipped).
 */
export const SAVE_ORDER = [
  'problem',
  'translation.vi',
  'translation.en',
  'editorial',
  'data',
] as const;
export type SavePartId = (typeof SAVE_ORDER)[number];

/** What sending one part came to. `code`: the problem's code after a problem PATCH. `warning`: saved, with a complaint. */
export interface SavePartAnswer {
  failure?: string;
  warning?: string;
  code?: string;
}

export interface SavePart {
  id: SavePartId;
  run: (code: string) => Promise<SavePartAnswer>;
}

export interface SavePartOutcome {
  id: SavePartId;
  status: 'saved' | 'failed' | 'skipped';
  /** Why it failed, or what the server said about a part it did save. */
  note?: string;
}

export interface SaveRun {
  /** The problem's code once every part was tried: the new one after a rename. */
  code: string;
  outcomes: SavePartOutcome[];
}

const orderOf = (part: SavePart) => SAVE_ORDER.indexOf(part.id);

/** Sends `parts` in `SAVE_ORDER` to the problem `code` and reports each one. */
export async function runSaveParts(code: string, parts: readonly SavePart[]): Promise<SaveRun> {
  const outcomes: SavePartOutcome[] = [];
  let target = code;
  let isStopped = false;
  for (const part of [...parts].sort((first, second) => orderOf(first) - orderOf(second))) {
    if (isStopped) {
      outcomes.push({ id: part.id, status: 'skipped' });
      continue;
    }
    const answer = await part.run(target);
    if (answer.failure !== undefined) {
      outcomes.push({ id: part.id, status: 'failed', note: answer.failure });
      isStopped = part.id === 'problem';
      continue;
    }
    target = answer.code ?? target;
    outcomes.push({ id: part.id, status: 'saved', note: answer.warning });
  }
  return { code: target, outcomes };
}

export const isAllSaved = (outcomes: readonly SavePartOutcome[]) =>
  outcomes.every((outcome) => outcome.status === 'saved');
