import { isAllSaved, runOrderedParts } from '../../ui/workbench/save-parts';
import type { SavePartOutcome as Outcome } from '../../ui/workbench/save-parts';

/**
 * The problem workbench's one save, as parts sent one after another (the shared runner, `ui/workbench/save-parts.ts`).
 * The order is fixed here, not by the caller: the problem PATCH goes first because a changed code moves the test data
 * and every later part must be sent to the new code; the data configuration goes last. There is no transaction: a part
 * that fails stays unsaved and the parts after it are still tried, except after a failed problem PATCH (the code the
 * later parts need is then unknown, so they are skipped).
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

export type SavePartOutcome = Outcome<SavePartId>;

export interface SaveRun {
  /** The problem's code once every part was tried: the new one after a rename. */
  code: string;
  outcomes: SavePartOutcome[];
}

/** Sends `parts` in `SAVE_ORDER` to the problem `code` and reports each one. */
export async function runSaveParts(code: string, parts: readonly SavePart[]): Promise<SaveRun> {
  const run = await runOrderedParts(
    code,
    parts.map((part) => ({
      id: part.id,
      run: async (target: string) => {
        const { code: renamed, ...answer } = await part.run(target);
        return { ...answer, target: renamed };
      },
    })),
    SAVE_ORDER,
    ['problem'],
  );
  return { code: run.target, outcomes: run.outcomes };
}

export { isAllSaved };
