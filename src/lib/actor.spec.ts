import { describe, expect, it } from 'vitest';
import { actorName } from './actor';

describe('actorName', () => {
  it('names the user', () => {
    expect(actorName({ username: 'minhthu' })).toBe('minhthu');
  });

  it('renders a null actor as a dash', () => {
    expect(actorName(null)).toBe('—');
  });
});
