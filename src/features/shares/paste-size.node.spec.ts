import { describe, expect, it } from 'vitest';
import { PASTE_MAX_BYTES } from '@/api/types/shares';
import { pasteSize } from './paste-size';

describe('pasteSize', () => {
  it('counts UTF-8 bytes, as the backend does, not characters', () => {
    expect(pasteSize('é').bytes).toBe(2);
    expect(
      pasteSize('a'.repeat(PASTE_MAX_BYTES / 2) + 'é'.repeat(PASTE_MAX_BYTES / 4)).isTooLarge,
    ).toBe(false);
    expect(pasteSize('é'.repeat(PASTE_MAX_BYTES / 2 + 1)).isTooLarge).toBe(true);
  });

  it('counts lines and treats blank text as empty', () => {
    expect(pasteSize('a\nb\n').lines).toBe(2);
    expect(pasteSize('   \n').isEmpty).toBe(true);
    expect(pasteSize('').lines).toBe(0);
  });
});
