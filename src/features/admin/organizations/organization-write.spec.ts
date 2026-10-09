import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { ApiError } from '@/api/client';
import { mountComponent } from '@/test/mount';
import { useOrganizationWrite } from './organization-write';

/** The wrapper needs a query client, so it runs inside a mounted component. */
function mountWrite<Vars, Result>(mutate: (vars: Vars) => Promise<Result>) {
  let api!: ReturnType<typeof useOrganizationWrite<Vars, Result>>;
  mountComponent(
    defineComponent({
      setup() {
        api = useOrganizationWrite<Vars, Result>({ mutate, invalidates: () => [] });
        return () => h('div');
      },
    }),
  );
  return api;
}

describe('useOrganizationWrite', () => {
  it('sends one request for a second call while the first is in flight', async () => {
    let release: (value: string) => void = () => undefined;
    const mutate = vi.fn(() => new Promise<string>((resolve) => (release = resolve)));
    const write = mountWrite(mutate);
    const first = write.run('a');
    const second = await write.run('b');
    expect(second).toBe(false);
    expect(mutate).toHaveBeenCalledTimes(1);
    release('done');
    expect(await first).toBe(true);
    mutate.mockImplementation(() => Promise.resolve('next'));
    expect(await write.run('c')).toBe(true);
    expect(mutate).toHaveBeenCalledTimes(2);
  });

  it('clears the last failure on reset, so the next dialog shows no old error', async () => {
    const mutate = vi.fn(() => Promise.reject(new ApiError('conflict', 409, 'conflict')));
    const write = mountWrite(mutate);
    expect(await write.run('a')).toBe(false);
    expect(write.failure.value?.status).toBe(409);
    write.reset();
    expect(write.failure.value).toBeNull();
    expect(write.fieldErrors.value).toEqual({});
  });
});
