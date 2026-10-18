import { describe, expect, it } from 'vitest';
import { SETTING_BLOCKS } from './setting-blocks';
import { dirtyByTab, saveDirtyBlocks, tabFromQuery } from './settings-page';

describe('settings tabs', () => {
  it('opens a known tab and falls back to the first for anything else', () => {
    expect(tabFromQuery('limits')).toBe('limits');
    expect(tabFromQuery('nope')).toBe('general');
    expect(tabFromQuery(undefined)).toBe('general');
  });

  it('puts every block in exactly one tab', () => {
    const ids = SETTING_BLOCKS.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sums unsaved keys per tab from the blocks that reported', () => {
    expect(dirtyByTab(SETTING_BLOCKS, { contest: 2, site: 1, quota: 3, mail: 0 })).toEqual({
      general: 3,
      accounts: 0,
      integrations: 0,
      limits: 3,
      public: 0,
    });
  });
});

describe('saveDirtyBlocks', () => {
  it('saves only the blocks with changes, in page order, and goes on past a refusal', async () => {
    const asked: string[] = [];
    const result = await saveDirtyBlocks(
      ['site', 'contest', 'mail', 'quota'],
      { site: 0, contest: 2, mail: 1, quota: 1 },
      (id) => {
        asked.push(id);
        return Promise.resolve(id === 'contest' ? 'refused' : 'saved');
      },
    );
    expect(asked).toEqual(['contest', 'mail', 'quota']);
    expect(result).toEqual({ saved: ['mail', 'quota'], refused: ['contest'] });
  });

  it('counts a block with nothing to send as neither saved nor refused', async () => {
    const result = await saveDirtyBlocks(['site'], { site: 1 }, () => Promise.resolve('unchanged'));
    expect(result).toEqual({ saved: [], refused: [] });
  });
});
