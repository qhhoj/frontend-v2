import { describe, expect, it } from 'vitest';
import { isRepeatedSubmitKey } from './code-editor-cm';

const press = (init: Partial<KeyboardEventInit>) => new KeyboardEvent('keydown', init);

describe('isRepeatedSubmitKey', () => {
  it('flags only auto-repeats of Ctrl or Cmd Enter', () => {
    expect(isRepeatedSubmitKey(press({ key: 'Enter', ctrlKey: true, repeat: true }))).toBe(true);
    expect(isRepeatedSubmitKey(press({ key: 'Enter', metaKey: true, repeat: true }))).toBe(true);
    expect(isRepeatedSubmitKey(press({ key: 'Enter', ctrlKey: true }))).toBe(false);
    expect(isRepeatedSubmitKey(press({ key: 'Enter', repeat: true }))).toBe(false);
    expect(isRepeatedSubmitKey(press({ key: 'a', ctrlKey: true, repeat: true }))).toBe(false);
  });
});
