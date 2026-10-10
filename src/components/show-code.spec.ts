import type * as Languages from './code-languages';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.doUnmock('./code-languages'));

/** A pack loader whose answers the test settles in any order. */
async function withControlledPacks() {
  const { loadLanguagePack: real } =
    await vi.importActual<Pick<typeof Languages, 'loadLanguagePack'>>('./code-languages');
  const settle = new Map<string, () => void>();
  vi.resetModules();
  vi.doMock('./code-languages', () => ({
    loadLanguagePack: async (ace: string) => {
      const pack = await real(ace);
      await new Promise<void>((resolve) => settle.set(ace, resolve));
      return pack;
    },
  }));
  const { showCode } = await import('./code-highlight');
  return { showCode, settle };
}

describe('showCode', () => {
  it('ignores an older call that finishes after a newer one', async () => {
    const { showCode, settle } = await withControlledPacks();
    const target = document.createElement('pre');
    document.body.append(target);
    const older = showCode(target, 'int x;', 'c_cpp');
    const newer = showCode(target, 'int x;', 'python');
    await vi.waitFor(() => expect(settle.size).toBe(2));
    settle.get('python')!();
    await newer;
    const afterNewer = target.innerHTML;
    settle.get('c_cpp')!();
    await older;
    expect(target.innerHTML).toBe(afterNewer);
    expect(target.textContent).toBe('int x;');
    target.remove();
  });

  it('keeps the block plain when a later call has no language and the earlier one lands last', async () => {
    const { showCode, settle } = await withControlledPacks();
    const target = document.createElement('pre');
    document.body.append(target);
    const older = showCode(target, 'int x;', 'c_cpp');
    await showCode(target, 'int x;', null);
    await vi.waitFor(() => expect(settle.size).toBe(1));
    settle.get('c_cpp')!();
    await older;
    expect(target.querySelector('span')).toBeNull();
    expect(target.textContent).toBe('int x;');
    target.remove();
  });
});
