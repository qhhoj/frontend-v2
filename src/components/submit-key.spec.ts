import { describe, expect, it } from 'vitest';
import { blockHeldEnter, isRepeatedSubmitKey } from './submit-key';

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

describe('blockHeldEnter', () => {
  it('cancels a repeated Enter (the button click) but not the first press or other keys', () => {
    const cancelled = (init: KeyboardEventInit) => {
      const event = new KeyboardEvent('keydown', { ...init, cancelable: true });
      blockHeldEnter(event);
      return event.defaultPrevented;
    };
    expect(cancelled({ key: 'Enter', repeat: true })).toBe(true);
    expect(cancelled({ key: 'Enter' })).toBe(false);
    expect(cancelled({ key: ' ', repeat: true })).toBe(false);
  });
});
