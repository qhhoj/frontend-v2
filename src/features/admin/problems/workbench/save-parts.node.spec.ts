import { describe, expect, it } from 'vitest';
import { runSaveParts } from './save-parts';
import type { SavePart, SavePartAnswer, SavePartId } from './save-parts';

/** Parts that record the code each one was sent to. */
function recorder(answers: Partial<Record<SavePartId, SavePartAnswer>> = {}) {
  const sent: string[] = [];
  const part = (id: SavePartId): SavePart => ({
    id,
    run: (code) => {
      sent.push(`${id}@${code}`);
      return Promise.resolve(answers[id] ?? {});
    },
  });
  return { sent, part };
}

describe('runSaveParts', () => {
  it('sends the problem PATCH first and the data configuration last, whatever order the caller lists them in', async () => {
    const { sent, part } = recorder();
    await runSaveParts('old', [part('data'), part('translation.en'), part('problem')]);
    expect(sent).toEqual(['problem@old', 'translation.en@old', 'data@old']);
  });

  it('sends every later part to the code a rename answered with', async () => {
    const { sent, part } = recorder({ problem: { code: 'new' } });
    const run = await runSaveParts('old', [part('problem'), part('translation.vi'), part('data')]);
    expect(sent).toEqual(['problem@old', 'translation.vi@new', 'data@new']);
    expect(run.code).toBe('new');
  });

  it('skips the later parts after a failed problem PATCH and sends them nowhere', async () => {
    const { sent, part } = recorder({ problem: { failure: 'code taken' } });
    const run = await runSaveParts('old', [part('problem'), part('translation.vi'), part('data')]);
    expect(sent).toEqual(['problem@old']);
    expect(run.outcomes).toEqual([
      { id: 'problem', status: 'failed', note: 'code taken' },
      { id: 'translation.vi', status: 'skipped' },
      { id: 'data', status: 'skipped' },
    ]);
    expect(run.code).toBe('old');
  });

  it('keeps trying the other parts after a translation fails, and reports each part', async () => {
    const { sent, part } = recorder({
      'translation.vi': { failure: 'too long' },
      data: { warning: 'missing 3.out' },
    });
    const run = await runSaveParts('p', [part('problem'), part('translation.vi'), part('data')]);
    expect(sent).toEqual(['problem@p', 'translation.vi@p', 'data@p']);
    expect(run.outcomes).toEqual([
      { id: 'problem', status: 'saved', note: undefined },
      { id: 'translation.vi', status: 'failed', note: 'too long' },
      { id: 'data', status: 'saved', note: 'missing 3.out' },
    ]);
  });
});
