import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { decideInTurn } from './join-request-bulk';

const refusal = (code: string) => new ApiError('conflict', 409, code);

describe('decideInTurn', () => {
  it('decides one at a time, keeps going after a refusal and reports the first one', async () => {
    const order: string[] = [];
    let running = 0;
    const outcome = await decideInTurn(['a', 'full', 'b', 'gone'], async (id) => {
      running += 1;
      expect(running).toBe(1);
      await Promise.resolve();
      order.push(id);
      running -= 1;
      if (id === 'full' || id === 'gone') throw refusal(id);
    });
    expect(order).toEqual(['a', 'full', 'b', 'gone']);
    expect(outcome).toMatchObject({ done: 2, failed: 2 });
    expect((outcome.firstFailure as ApiError).message).toBe('full');
  });

  it('lets a programming error surface instead of counting it as a refusal', async () => {
    await expect(
      decideInTurn(['a'], () => Promise.reject(new TypeError('broken'))),
    ).rejects.toThrow('broken');
  });
});
