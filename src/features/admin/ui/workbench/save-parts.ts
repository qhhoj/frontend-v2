/**
 * A workbench's one save, as parts sent one after another in a fixed order. There is no transaction: a part that fails
 * stays unsaved and the parts after it are still tried, except after a failed part named in `stopsOn` (a later part
 * needs what that one answers). `target` is where the parts are sent (a problem's code, a contest's key); a part may
 * answer a new one, which every later part then uses.
 */

/** What sending one part came to. `target`: the new address after this part. `warning`: saved, with a complaint. */
export interface SavePartAnswer {
  failure?: string;
  warning?: string;
  target?: string;
}

export interface SavePart<Id extends string> {
  id: Id;
  run: (target: string) => Promise<SavePartAnswer>;
}

export interface SavePartOutcome<Id extends string> {
  id: Id;
  status: 'saved' | 'failed' | 'skipped';
  /** Why it failed, or what the server said about a part it did save. */
  note?: string;
}

export interface SaveRun<Id extends string> {
  /** The address once every part was tried: the new one after a rename. */
  target: string;
  outcomes: SavePartOutcome<Id>[];
}

/** Sends `parts` in `order` to `target` and reports each one. */
export async function runOrderedParts<Id extends string>(
  target: string,
  parts: readonly SavePart<Id>[],
  order: readonly Id[],
  stopsOn: readonly Id[] = [],
): Promise<SaveRun<Id>> {
  const outcomes: SavePartOutcome<Id>[] = [];
  let current = target;
  let isStopped = false;
  const sorted = [...parts].sort(
    (first, second) => order.indexOf(first.id) - order.indexOf(second.id),
  );
  for (const part of sorted) {
    if (isStopped) {
      outcomes.push({ id: part.id, status: 'skipped' });
      continue;
    }
    const answer = await part.run(current);
    if (answer.failure !== undefined) {
      outcomes.push({ id: part.id, status: 'failed', note: answer.failure });
      isStopped = stopsOn.includes(part.id);
      continue;
    }
    current = answer.target ?? current;
    outcomes.push({ id: part.id, status: 'saved', note: answer.warning });
  }
  return { target: current, outcomes };
}

export const isAllSaved = (outcomes: readonly SavePartOutcome<string>[]) =>
  outcomes.every((outcome) => outcome.status === 'saved');
