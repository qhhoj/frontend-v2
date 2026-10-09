import { describe, expect, it } from 'vitest';
import { toLocalInput } from '../../ui/datetime';
import { publishOnToSend } from './editorial-draft';

const NOW = new Date('2026-10-09T01:02:03.000Z');
const STORED = '2026-10-08T06:00:42.123Z';

describe('publishOnToSend', () => {
  it('keeps the stored instant, seconds included, while the box still shows its minute', () => {
    expect(publishOnToSend(toLocalInput(STORED), STORED, NOW)).toBe(STORED);
  });

  it('sends the box as an instant once it was changed', () => {
    expect(publishOnToSend('2026-10-09T08:30', STORED, NOW)).toBe(
      new Date('2026-10-09T08:30').toISOString(),
    );
  });

  it('publishes from now for an empty box, with or without a stored instant', () => {
    expect(publishOnToSend('', STORED, NOW)).toBe(NOW.toISOString());
    expect(publishOnToSend('', null, NOW)).toBe(NOW.toISOString());
  });
});
