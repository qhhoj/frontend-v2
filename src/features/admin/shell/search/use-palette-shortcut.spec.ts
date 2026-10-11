import { describe, expect, it } from 'vitest';
import { isPaletteShortcut } from './use-palette-shortcut';

/** A keydown dispatched on `target`, as the window listener would receive it. */
function keydownOn(target: HTMLElement, init: KeyboardEventInit): KeyboardEvent {
  document.body.append(target);
  let seen: KeyboardEvent | undefined;
  target.addEventListener('keydown', (event) => (seen = event));
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  target.remove();
  return seen!;
}
const input = (type = 'text') => Object.assign(document.createElement('input'), { type });

describe('isPaletteShortcut', () => {
  it('takes a bare slash outside text fields only', () => {
    expect(isPaletteShortcut(keydownOn(document.createElement('div'), { key: '/' }))).toBe(true);
    expect(isPaletteShortcut(keydownOn(input('checkbox'), { key: '/' }))).toBe(true);
    expect(isPaletteShortcut(keydownOn(input(), { key: '/' }))).toBe(false);
    expect(isPaletteShortcut(keydownOn(document.createElement('textarea'), { key: '/' }))).toBe(
      false,
    );
  });

  it('takes Ctrl+K and ⌘K even inside a text field', () => {
    expect(isPaletteShortcut(keydownOn(input(), { key: 'k', ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(keydownOn(input(), { key: 'K', metaKey: true }))).toBe(true);
  });

  it('leaves other chords and keys a widget already handled alone', () => {
    const div = () => document.createElement('div');
    expect(isPaletteShortcut(keydownOn(div(), { key: 'k', ctrlKey: true, shiftKey: true }))).toBe(
      false,
    );
    expect(isPaletteShortcut(keydownOn(div(), { key: 'k' }))).toBe(false);
    const handled = keydownOn(div(), { key: '/' });
    handled.preventDefault();
    expect(isPaletteShortcut(handled)).toBe(false);
  });
});
